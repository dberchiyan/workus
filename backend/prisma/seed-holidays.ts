import type { PrismaClient } from '../src/generated/prisma/client';

/**
 * Company holidays (dev only): a common international set — editable in Settings → Holidays.
 * Recurring ones are copied to the next year by the app (on start and daily); Easter Monday
 * moves every year, so each year has its own one-off entry.
 */
const HOLIDAYS: readonly { date: string; name: string; recurring: boolean }[] = [
  { date: '2026-01-01', name: 'New Year’s Day', recurring: true },
  { date: '2026-04-06', name: 'Easter Monday', recurring: false },
  { date: '2026-05-01', name: 'Labour Day', recurring: true },
  { date: '2026-11-27', name: 'Company Day', recurring: false },
  { date: '2026-12-24', name: 'Christmas Eve', recurring: true },
  { date: '2026-12-25', name: 'Christmas Day', recurring: true },
  { date: '2026-12-31', name: 'New Year’s Eve', recurring: true },
  { date: '2027-03-29', name: 'Easter Monday', recurring: false },
];

/**
 * Adds the holidays not there yet and takes their working days from held requests that cover
 * them (the statement the app uses — TimeOffRequestRepository.shiftDaysForHolidays).
 */
export const seedHolidays = async (prisma: PrismaClient): Promise<number> => {
  const added = await prisma.companyHoliday.createManyAndReturn({
    data: HOLIDAYS.map((holiday) => ({ ...holiday, date: new Date(`${holiday.date}T00:00:00Z`) })),
    skipDuplicates: true,
    select: { date: true },
  });
  const days = added.map((holiday) => holiday.date.toISOString().slice(0, 10));
  if (days.length > 0) {
    await prisma.$executeRaw`
      UPDATE "time_off_requests" AS r
      SET "days" = GREATEST(0, r."days" - (
        SELECT count(*)::int FROM unnest(${days}::date[]) AS h(day)
        WHERE h.day BETWEEN r."start_date" AND r."end_date" AND EXTRACT(ISODOW FROM h.day) < 6
      ))
      WHERE r."status" IN ('PENDING', 'APPROVED')
        AND EXISTS (
          SELECT 1 FROM unnest(${days}::date[]) AS h(day)
          WHERE h.day BETWEEN r."start_date" AND r."end_date" AND EXTRACT(ISODOW FROM h.day) < 6
        )`;
  }
  return added.length;
};
