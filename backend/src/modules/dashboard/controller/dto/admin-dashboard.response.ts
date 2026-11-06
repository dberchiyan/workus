import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PersonSchema = z.object({
  /** User id (avatar colour). */
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
});

export class AdminDashboardResponse extends createZodDto(
  z.object({
    /** The server's today (UTC) the figures are counted for. */
    today: z.iso.date(),
    pendingRequests: z.object({
      count: z.number().int(),
      /** When the oldest pending request was made; null without any. */
      oldestCreatedAt: z.iso.datetime().nullable(),
    }),
    outToday: z.object({
      count: z.number().int(),
      /** The first few, by name. */
      people: z.array(PersonSchema),
      /** Others off on a later day of this week. */
      laterThisWeek: z.number().int(),
    }),
    reviewsDue: z.object({
      /** Scheduled in the next 30 days. */
      upcoming: z.number().int(),
      /** Scheduled with a date that has passed. */
      overdue: z.number().int(),
    }),
    movements: z.object({
      /** Starting in the next 30 days. */
      joining: z.number().int(),
      /** Leaving (termination date) in the next 30 days. */
      leaving: z.number().int(),
      next: z
        .object({
          kind: z.enum(['JOINING', 'LEAVING']),
          date: z.iso.date(),
          employeeId: z.uuid(),
          person: PersonSchema,
        })
        .nullable(),
    }),
  }),
) {}
