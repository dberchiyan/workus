import type { Prisma } from '../../../../generated/prisma/client';

export const holidaySelect = {
    id: true,
    organisationId: true,
    heldAt: true,
    name: true,
    isRecurring: true,
    isCarriedOver: true,
    version: true,
} satisfies Prisma.CompanyHolidaySelect;
export type HolidayRecord = Prisma.CompanyHolidayGetPayload<{ select: typeof holidaySelect }>;

/** A holiday as a day off on the calendar. */
export const holidayDaySelect = { heldAt: true, name: true } satisfies Prisma.CompanyHolidaySelect;
export type HolidayDayRecord = Prisma.CompanyHolidayGetPayload<{
    select: typeof holidayDaySelect;
}>;
