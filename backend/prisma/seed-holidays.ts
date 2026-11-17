import type { PrismaClient } from '../src/generated/prisma/client';

const HOLIDAYS: readonly { heldAt: string; name: string; isRecurring: boolean }[] = [
    { heldAt: '2026-01-01', name: 'New Year’s Day', isRecurring: true },
    { heldAt: '2026-04-06', name: 'Easter Monday', isRecurring: false },
    { heldAt: '2026-05-01', name: 'Labour Day', isRecurring: true },
    { heldAt: '2026-11-27', name: 'Company Day', isRecurring: false },
    { heldAt: '2026-12-24', name: 'Christmas Eve', isRecurring: true },
    { heldAt: '2026-12-25', name: 'Christmas Day', isRecurring: true },
    { heldAt: '2026-12-31', name: 'New Year’s Eve', isRecurring: true },
    { heldAt: '2027-03-29', name: 'Easter Monday', isRecurring: false },
];

/**
 * Adds the holidays not there yet and takes their working days from held requests that cover
 * them (the statement the app uses — TimeOffRequestRepository.shiftDaysForHolidays).
 */
export const seedHolidays = async (prisma: PrismaClient, organisationId: string): Promise<number> => {
    const added = await prisma.companyHoliday.createManyAndReturn({
        data: HOLIDAYS.map((holiday) => ({
            ...holiday,
            organisationId,
            heldAt: new Date(`${holiday.heldAt}T00:00:00Z`),
        })),
        skipDuplicates: true,
        select: { heldAt: true },
    });
    const days = added.map((holiday) => holiday.heldAt.toISOString().slice(0, 10));
    if (days.length > 0) {
        await prisma.$executeRaw`
      UPDATE "time_off_requests" AS r
      SET "days" = GREATEST(0, r."days" - (
        SELECT count(*)::int FROM unnest(${days}::date[]) AS h(day)
        WHERE h.day BETWEEN r."starts_at" AND r."ends_at" AND EXTRACT(ISODOW FROM h.day) < 6
      ))
      WHERE r."organisation_id" = ${organisationId}::uuid
        AND r."status" IN ('PENDING', 'APPROVED')
        AND EXISTS (
          SELECT 1 FROM unnest(${days}::date[]) AS h(day)
          WHERE h.day BETWEEN r."starts_at" AND r."ends_at" AND EXTRACT(ISODOW FROM h.day) < 6
        )`;
    }
    return added.length;
};
