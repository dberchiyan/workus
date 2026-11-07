import type { Prisma } from '../../../../generated/prisma/client';

export const holidaySelect = {
  id: true,
  organisationId: true,
  date: true,
  name: true,
  recurring: true,
  carriedOver: true,
  version: true,
} satisfies Prisma.CompanyHolidaySelect;
export type HolidayRecord = Prisma.CompanyHolidayGetPayload<{ select: typeof holidaySelect }>;

/** A holiday as a day off on the calendar. */
export const holidayDaySelect = { date: true, name: true } satisfies Prisma.CompanyHolidaySelect;
export type HolidayDayRecord = Prisma.CompanyHolidayGetPayload<{
  select: typeof holidayDaySelect;
}>;
