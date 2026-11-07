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

const EmployeeSchema = z.object({
  id: z.uuid(),
  /** For the avatar colour. */
  userId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  positionTitle: z.string(),
});

const DashboardRequestSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(['VACATION', 'SICK_DAY', 'DAY_OFF']),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELED']),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    days: z.number().int(),
    createdAt: z.iso.datetime(),
    employee: EmployeeSchema,
  })
  .meta({ id: 'DashboardRequest' });

const DashboardReviewSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    reviewDate: z.iso.date(),
    status: z.enum(['SCHEDULED', 'COMPLETED']),
    employee: EmployeeSchema,
  })
  .meta({ id: 'DashboardReview' });

/** Day and month only — the year (age) is personal data. */
const DashboardBirthdaySchema = z
  .object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    employee: EmployeeSchema,
  })
  .meta({ id: 'DashboardBirthday' });

/** A page (reviews, birthdays) or the first 100 (requests); `totalElements` counts them all. */
const listOf = <T extends z.ZodType>(item: T) =>
  z.object({
    content: z.array(item),
    totalElements: z.number().int(),
  });

export class DashboardRequestsResponse extends createZodDto(listOf(DashboardRequestSchema)) {}

export class DashboardReviewsResponse extends createZodDto(listOf(DashboardReviewSchema)) {}

export class DashboardBirthdaysResponse extends createZodDto(listOf(DashboardBirthdaySchema)) {}
