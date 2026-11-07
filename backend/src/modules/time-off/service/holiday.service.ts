import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  BusinessConflictException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../common/exception/api.exception';
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import {
  type AuditChange,
  AuditField,
  auditValue,
  changeOf,
} from '../../audit/service/audit-change';
import { AuditService } from '../../audit/service/audit.service';
import type { NewAuditEvent } from '../../audit/service/audit.types';
import { HolidayRepository, type NewHoliday } from '../repository/holiday.repository';
import type { HolidayDayRecord, HolidayRecord } from '../repository/record/holiday.record';
import { TimeOffRequestRepository } from '../repository/time-off-request.repository';
import { isoDay, todayUtc } from './leave-policy';

export interface HolidayInput {
  date: string;
  name: string;
  recurring: boolean;
}

const asDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

/** The same day a year later; 29 February becomes 28 February. */
const sameDayNextYear = (date: Date): Date => {
  const year = date.getUTCFullYear() + 1;
  const month = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
};

const fieldsOf = (holiday: { date: Date; name: string; recurring: boolean } | null) => ({
  date: holiday ? auditValue.date(holiday.date) : null,
  name: holiday ? auditValue.text(holiday.name) : null,
  recurring: holiday ? auditValue.flag(holiday.recurring) : null,
});

const changesBetween = (
  before: { date: Date; name: string; recurring: boolean } | null,
  after: { date: Date; name: string; recurring: boolean } | null,
): AuditChange[] => {
  const from = fieldsOf(before);
  const to = fieldsOf(after);
  return [
    ...changeOf(AuditField.DATE, from.date, to.date),
    ...changeOf(AuditField.NAME, from.name, to.name),
    ...changeOf(AuditField.RECURRING, from.recurring, to.recurring),
  ];
};

/**
 * Company holidays: days off for everyone, so time off on them takes no working day. Adding,
 * moving or removing one keeps the working days of held (pending, approved) requests in step.
 * A recurring holiday is copied to the same day of the next year once its own year has come —
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

  /** One year's holidays, by date. */
  findYear(year: number): Promise<HolidayRecord[]> {
    return this.holidayRepository.findBetween(
      new Date(Date.UTC(year, 0, 1)),
      new Date(Date.UTC(year, 11, 31)),
    );
  }

  /** Holidays (day and name) in [from, to] — the calendar. */
  daysBetween(from: Date, to: Date): Promise<HolidayDayRecord[]> {
    return this.holidayRepository.findDaysBetween(from, to);
  }

  /** `YYYY-MM-DD` of the holidays in [from, to] — working-day counts. */
  async datesBetween(from: Date, to: Date): Promise<Set<string>> {
    const days = await this.holidayRepository.findDaysBetween(from, to);
    return new Set(days.map((day) => isoDay(day.date)));
  }

  @Transactional()
  async create(input: HolidayInput, actorId: string): Promise<HolidayRecord> {
    const holiday = { date: asDate(input.date), name: input.name, recurring: input.recurring };
    await this.requireFreeDate(holiday.date);
    const created = await this.holidayRepository.create(holiday, actorId);
    await this.requestRepository.shiftDaysForHolidays([isoDay(created.date)], -1);
    await this.auditService.record(this.event(AuditAction.HOLIDAY_CREATED, created, null, created));
    await this.carryOver(actorId);
    return (await this.holidayRepository.findById(created.id)) ?? created;
  }

  @Transactional()
  async update(
    id: string,
    input: HolidayInput & { version: number },
    actorId: string,
  ): Promise<HolidayRecord> {
    const before = await this.holidayRepository.findById(id);
    if (!before) {
      throw new ResourceNotFoundException();
    }
    const holiday: NewHoliday = {
      date: asDate(input.date),
      name: input.name,
      recurring: input.recurring,
    };
    if (isoDay(holiday.date) !== isoDay(before.date)) {
      await this.requireFreeDate(holiday.date, id);
    }
    const after = await this.holidayRepository.update(id, input.version, holiday, actorId);
    if (!after) {
      throw new ConcurrentModificationException();
    }
    if (isoDay(after.date) !== isoDay(before.date)) {
      await this.requestRepository.shiftDaysForHolidays([isoDay(before.date)], 1);
      await this.requestRepository.shiftDaysForHolidays([isoDay(after.date)], -1);
    }
    const changes = changesBetween(before, after);
    if (changes.length > 0) {
      await this.auditService.record({
        ...this.event(AuditAction.HOLIDAY_UPDATED, after, before, after),
        changes,
      });
    }
    // Made recurring in a year that has come: its copy for the next year is due now.
    await this.carryOver(actorId);
    return (await this.holidayRepository.findById(id)) ?? after;
  }

  @Transactional()
  async remove(id: string): Promise<void> {
    const holiday = await this.holidayRepository.findById(id);
    if (!holiday || !(await this.holidayRepository.delete(id))) {
      throw new ResourceNotFoundException();
    }
    await this.requestRepository.shiftDaysForHolidays([isoDay(holiday.date)], 1);
    await this.auditService.record(this.event(AuditAction.HOLIDAY_DELETED, holiday, holiday, null));
  }

  /**
   * Copies every recurring holiday of a year that has come (up to this year) to the next year,
   * once. A date already taken there is skipped. Runs after each change and daily, so a new
   * year gets the following year's holidays on its first day. Returns how many were copied.
   */
  @Transactional()
  async carryOver(actorId: string | null): Promise<number> {
    const today = todayUtc();
    const sources = await this.holidayRepository.findToCarryOver(
      new Date(Date.UTC(today.getUTCFullYear(), 11, 31)),
    );
    if (sources.length === 0) {
      return 0;
    }
    const copies = await this.holidayRepository.createCopies(
      sources.map((source) => ({
        date: sameDayNextYear(source.date),
        name: source.name,
        recurring: true,
      })),
      actorId,
    );
    await this.holidayRepository.markCarriedOver(sources.map((source) => source.id));
    await this.requestRepository.shiftDaysForHolidays(
      copies.map((copy) => isoDay(copy.date)),
      -1,
    );
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
    const count = await this.carryOver(null);
    if (count > 0) {
      this.logger.info({ count }, 'Recurring holidays copied to the next year');
    }
  }

  private async requireFreeDate(date: Date, exceptId?: string): Promise<void> {
    if (await this.holidayRepository.existsOnDate(date, exceptId)) {
      throw new BusinessConflictException('errors.holiday.dateTaken', {}, 'date');
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
      employeeId: null,
      target: { type: AuditTargetType.HOLIDAY, id: target.id, label: target.name },
      changes: changesBetween(before, after),
    };
  }
}
