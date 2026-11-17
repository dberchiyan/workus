import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import {
    BusinessConflictException,
    ConcurrentModificationException,
    ResourceNotFoundException,
} from '../../../common/exception/api.exception';
import { DECEMBER, LAST_DAY_OF_DECEMBER } from '../../../common/time/units';
import { AuditService } from '../../audit/service/audit.service';
import type { NewAuditEvent } from '../../audit/service/audit.types';
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import { type AuditChange, AuditField, auditValue, changeOf } from '../../audit/service/audit-change';
import { HolidayRepository, type NewHoliday } from '../repository/holiday.repository';
import type { HolidayDayRecord, HolidayRecord } from '../repository/record/holiday.record';
import { TimeOffRequestRepository } from '../repository/time-off-request.repository';
import { isoDay, todayUtc } from './leave-policy';

export interface HolidayInput {
    heldAt: string;
    name: string;
    isRecurring: boolean;
}

const asDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

/** A holiday as the day it takes from requests of its organisation. */
const dayOf = (holiday: HolidayRecord): { organisationId: string; day: string } => ({
    organisationId: holiday.organisationId,
    day: isoDay(holiday.heldAt),
});

/** The same day a year later; 29 February becomes 28 February. */
const sameDayNextYear = (heldAt: Date): Date => {
    const year = heldAt.getUTCFullYear() + 1;
    const month = heldAt.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(heldAt.getUTCDate(), lastDay)));
};

const fieldsOf = (holiday: { heldAt: Date; name: string; isRecurring: boolean } | null) => ({
    heldAt: holiday ? auditValue.date(holiday.heldAt) : null,
    name: holiday ? auditValue.text(holiday.name) : null,
    isRecurring: holiday ? auditValue.flag(holiday.isRecurring) : null,
});

const changesBetween = (
    before: { heldAt: Date; name: string; isRecurring: boolean } | null,
    after: { heldAt: Date; name: string; isRecurring: boolean } | null,
): AuditChange[] => {
    const from = fieldsOf(before);
    const to = fieldsOf(after);
    return [
        ...changeOf(AuditField.HELD_AT, from.heldAt, to.heldAt),
        ...changeOf(AuditField.NAME, from.name, to.name),
        ...changeOf(AuditField.RECURRING, from.isRecurring, to.isRecurring),
    ];
};

/**
 * Company holidays: days off for everyone, so time off on them takes no working day. Adding,
 * moving or removing one keeps the working days of held (pending, approved) requests in step.
 * A isRecurring holiday is copied to the same day of the next year once its own year has come —
 * so the current and the next year are always filled in; each copy is then edited on its own.
 */
@Injectable()
export class HolidayService implements OnApplicationBootstrap {
    constructor(
        private readonly holidayRepository: HolidayRepository,
        private readonly requestRepository: TimeOffRequestRepository,
        private readonly auditService: AuditService,
        @InjectPinoLogger(HolidayService.name) private readonly logger: PinoLogger,
    ) {}

    /** One year's holidays, by heldAt. */
    findYear(organisationId: string, year: number): Promise<HolidayRecord[]> {
        return this.holidayRepository.findBetween(
            organisationId,
            new Date(Date.UTC(year, 0, 1)),
            new Date(Date.UTC(year, DECEMBER, LAST_DAY_OF_DECEMBER)),
        );
    }

    /** Holidays (day and name) in [from, to] — the calendar. */
    daysBetween(organisationId: string, from: Date, to: Date): Promise<HolidayDayRecord[]> {
        return this.holidayRepository.findDaysBetween(organisationId, from, to);
    }

    /** `YYYY-MM-DD` of the holidays in [from, to] — working-day counts. */
    async datesBetween(organisationId: string, from: Date, to: Date): Promise<Set<string>> {
        const days = await this.holidayRepository.findDaysBetween(organisationId, from, to);
        return new Set(days.map((day) => isoDay(day.heldAt)));
    }

    @Transactional()
    async create(organisationId: string, input: HolidayInput, actorId: string): Promise<HolidayRecord> {
        const holiday = { heldAt: asDate(input.heldAt), name: input.name, isRecurring: input.isRecurring };
        await this.requireFreeDate(organisationId, holiday.heldAt);
        const created = await this.holidayRepository.create(organisationId, holiday, actorId);
        await this.requestRepository.shiftDaysForHolidays([dayOf(created)], -1);
        await this.auditService.record(this.event(AuditAction.HOLIDAY_CREATED, created, null, created));
        await this.carryOver(organisationId, actorId);
        return (await this.holidayRepository.findById(organisationId, created.id)) ?? created;
    }

    @Transactional()
    async update(
        organisationId: string,
        id: string,
        input: HolidayInput & { version: number },
        actorId: string,
    ): Promise<HolidayRecord> {
        const before = await this.holidayRepository.findById(organisationId, id);
        if (!before) {
            throw new ResourceNotFoundException();
        }
        const holiday: NewHoliday = {
            heldAt: asDate(input.heldAt),
            name: input.name,
            isRecurring: input.isRecurring,
        };
        if (isoDay(holiday.heldAt) !== isoDay(before.heldAt)) {
            await this.requireFreeDate(organisationId, holiday.heldAt, id);
        }
        const after = await this.holidayRepository.update(organisationId, id, input.version, holiday, actorId);
        if (!after) {
            throw new ConcurrentModificationException();
        }
        if (isoDay(after.heldAt) !== isoDay(before.heldAt)) {
            await this.requestRepository.shiftDaysForHolidays([dayOf(before)], 1);
            await this.requestRepository.shiftDaysForHolidays([dayOf(after)], -1);
        }
        const changes = changesBetween(before, after);
        if (changes.length > 0) {
            await this.auditService.record({
                ...this.event(AuditAction.HOLIDAY_UPDATED, after, before, after),
                changes,
            });
        }
        // Made isRecurring in a year that has come: its copy for the next year is due now.
        await this.carryOver(organisationId, actorId);
        return (await this.holidayRepository.findById(organisationId, id)) ?? after;
    }

    @Transactional()
    async remove(organisationId: string, id: string): Promise<void> {
        const holiday = await this.holidayRepository.findById(organisationId, id);
        if (!holiday || !(await this.holidayRepository.delete(organisationId, id))) {
            throw new ResourceNotFoundException();
        }
        await this.requestRepository.shiftDaysForHolidays([dayOf(holiday)], 1);
        await this.auditService.record(this.event(AuditAction.HOLIDAY_DELETED, holiday, holiday, null));
    }

    /**
     * Copies every isRecurring holiday of a year that has come (up to this year) to the next year,
     * once. A heldAt already taken there is skipped. Runs after each change (that organisation) and
     * daily (every organisation — null), so a new year gets the following year's holidays on its
     * first day. Returns how many were copied.
     */
    @Transactional()
    async carryOver(organisationId: string | null, actorId: string | null): Promise<number> {
        const today = todayUtc();
        const sources = await this.holidayRepository.findToCarryOver(
            organisationId,
            new Date(Date.UTC(today.getUTCFullYear(), DECEMBER, LAST_DAY_OF_DECEMBER)),
        );
        if (sources.length === 0) {
            return 0;
        }
        const copies = await this.holidayRepository.createCopies(
            sources.map((source) => ({
                organisationId: source.organisationId,
                heldAt: sameDayNextYear(source.heldAt),
                name: source.name,
                isRecurring: true,
            })),
            actorId,
        );
        await this.holidayRepository.markCarriedOver(sources.map((source) => source.id));
        await this.requestRepository.shiftDaysForHolidays(copies.map(dayOf), -1);
        await this.auditService.recordMany(
            copies.map((copy) => ({
                ...this.event(AuditAction.HOLIDAY_CREATED, copy, null, copy),
                actorUserId: actorId,
            })),
        );
        return copies.length;
    }

    /** Catches up a year change missed while the app was down. */
    async onApplicationBootstrap(): Promise<void> {
        await this.carryOverDaily();
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
    async carryOverDaily(): Promise<void> {
        const count = await this.carryOver(null, null);
        if (count > 0) {
            this.logger.info({ count }, 'Recurring holidays copied to the next year');
        }
    }

    private async requireFreeDate(organisationId: string, heldAt: Date, exceptId?: string): Promise<void> {
        if (await this.holidayRepository.existsOnDate(organisationId, heldAt, exceptId)) {
            throw new BusinessConflictException('errors.holiday.dateTaken', {}, 'heldAt');
        }
    }

    private event(
        action: AuditAction,
        target: HolidayRecord,
        before: HolidayRecord | null,
        after: HolidayRecord | null,
    ): NewAuditEvent {
        return {
            action,
            // The holiday's own organisation: the daily job has no principal.
            organisationId: target.organisationId,
            employeeId: null,
            target: { type: AuditTargetType.HOLIDAY, id: target.id, label: target.name },
            changes: changesBetween(before, after),
        };
    }
}
