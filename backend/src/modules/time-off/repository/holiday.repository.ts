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
  findBetween(from: Date, to: Date): Promise<HolidayRecord[]> {
    return this.txHost.tx.companyHoliday.findMany({
      where: { date: { gte: from, lte: to } },
      select: holidaySelect,
      orderBy: { date: 'asc' },
      take: MAX_HOLIDAYS,
    });
  }

  /** Their days and names only (calendar, working-day counts). */
  findDaysBetween(from: Date, to: Date): Promise<HolidayDayRecord[]> {
    return this.txHost.tx.companyHoliday.findMany({
      where: { date: { gte: from, lte: to } },
      select: holidayDaySelect,
      orderBy: { date: 'asc' },
      take: MAX_HOLIDAYS,
    });
  }

  findById(id: string): Promise<HolidayRecord | null> {
    return this.txHost.tx.companyHoliday.findUnique({ where: { id }, select: holidaySelect });
  }

  async existsOnDate(date: Date, exceptId?: string): Promise<boolean> {
    const count = await this.txHost.tx.companyHoliday.count({
      where: { date, ...(exceptId ? { id: { not: exceptId } } : {}) },
    });
    return count > 0;
  }

  create(holiday: NewHoliday, createdBy: string | null): Promise<HolidayRecord> {
    return this.txHost.tx.companyHoliday.create({
      data: { ...holiday, createdBy, updatedBy: createdBy },
      select: holidaySelect,
    });
  }

  /** Optimistic lock: null when the version is stale or the holiday is gone. */
  async update(
    id: string,
    version: number,
    holiday: NewHoliday,
    updatedBy: string,
  ): Promise<HolidayRecord | null> {
    const { count } = await this.txHost.tx.companyHoliday.updateMany({
      where: { id, version },
      data: { ...holiday, updatedBy, version: { increment: 1 } },
    });
    return count === 0 ? null : this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.txHost.tx.companyHoliday.deleteMany({ where: { id } });
    return count > 0;
  }

  /** Recurring holidays up to `until` whose copy for the next year has not been made. */
  findToCarryOver(until: Date): Promise<HolidayRecord[]> {
    return this.txHost.tx.companyHoliday.findMany({
      where: { recurring: true, carriedOver: false, date: { lte: until } },
      select: holidaySelect,
      orderBy: { date: 'asc' },
      take: MAX_HOLIDAYS,
    });
  }

  /** Inserts the copies; a date already taken is skipped. Returns the ones inserted. */
  createCopies(holidays: NewHoliday[], createdBy: string | null): Promise<HolidayRecord[]> {
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
