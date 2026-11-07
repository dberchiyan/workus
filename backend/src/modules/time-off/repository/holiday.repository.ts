import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import {
  type HolidayDayRecord,
  holidayDaySelect,
  type HolidayRecord,
  holidaySelect,
} from './record/holiday.record';

/** A year has at most 366 days, so one holiday per date bounds every range read here. */
const MAX_HOLIDAYS = 400;

export interface NewHoliday {
  date: Date;
  name: string;
  recurring: boolean;
}

@Injectable()
export class HolidayRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  /** Holidays in [from, to], by date. */
  findBetween(organisationId: string, from: Date, to: Date): Promise<HolidayRecord[]> {
    return this.txHost.tx.companyHoliday.findMany({
      where: { organisationId, date: { gte: from, lte: to } },
      select: holidaySelect,
      orderBy: { date: 'asc' },
      take: MAX_HOLIDAYS,
    });
  }

  /** Their days and names only (calendar, working-day counts). */
  findDaysBetween(organisationId: string, from: Date, to: Date): Promise<HolidayDayRecord[]> {
    return this.txHost.tx.companyHoliday.findMany({
      where: { organisationId, date: { gte: from, lte: to } },
      select: holidayDaySelect,
      orderBy: { date: 'asc' },
      take: MAX_HOLIDAYS,
    });
  }

  findById(organisationId: string, id: string): Promise<HolidayRecord | null> {
    return this.txHost.tx.companyHoliday.findUnique({
      where: { id, organisationId },
      select: holidaySelect,
    });
  }

  async existsOnDate(organisationId: string, date: Date, exceptId?: string): Promise<boolean> {
    const count = await this.txHost.tx.companyHoliday.count({
      where: { organisationId, date, ...(exceptId ? { id: { not: exceptId } } : {}) },
    });
    return count > 0;
  }

  create(
    organisationId: string,
    holiday: NewHoliday,
    createdBy: string | null,
  ): Promise<HolidayRecord> {
    return this.txHost.tx.companyHoliday.create({
      data: { ...holiday, organisationId, createdBy, updatedBy: createdBy },
      select: holidaySelect,
    });
  }

  /** Optimistic lock: null when the version is stale or the holiday is gone. */
  async update(
    organisationId: string,
    id: string,
    version: number,
    holiday: NewHoliday,
    updatedBy: string,
  ): Promise<HolidayRecord | null> {
    const { count } = await this.txHost.tx.companyHoliday.updateMany({
      where: { id, organisationId, version },
      data: { ...holiday, updatedBy, version: { increment: 1 } },
    });
    return count === 0 ? null : this.findById(organisationId, id);
  }

  async delete(organisationId: string, id: string): Promise<boolean> {
    const { count } = await this.txHost.tx.companyHoliday.deleteMany({
      where: { id, organisationId },
    });
    return count > 0;
  }

  /**
   * Recurring holidays up to `until` whose copy for the next year has not been made — of one
   * organisation, or of every one (null, the daily job; bounded per run, the rest next run).
   */
  findToCarryOver(organisationId: string | null, until: Date): Promise<HolidayRecord[]> {
    return this.txHost.tx.companyHoliday.findMany({
      where: {
        ...(organisationId ? { organisationId } : {}),
        recurring: true,
        carriedOver: false,
        date: { lte: until },
      },
      select: holidaySelect,
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
      take: MAX_HOLIDAYS,
    });
  }

  /** Inserts the copies; a date already taken is skipped. Returns the ones inserted. */
  createCopies(
    holidays: (NewHoliday & { organisationId: string })[],
    createdBy: string | null,
  ): Promise<HolidayRecord[]> {
    return this.txHost.tx.companyHoliday.createManyAndReturn({
      data: holidays.map((holiday) => ({ ...holiday, createdBy, updatedBy: createdBy })),
      skipDuplicates: true,
      select: holidaySelect,
    });
  }

  async markCarriedOver(ids: string[]): Promise<void> {
    await this.txHost.tx.companyHoliday.updateMany({
      where: { id: { in: ids } },
      data: { carriedOver: true },
    });
  }
}
