import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_DAYS_IN_MONTH, MONTHS_PER_YEAR } from '../../../../common/time/units';

const PersonSchema = z.object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
});

export class AdminDashboardResponse extends createZodDto(
    z.object({
        today: z.iso.date(),
        pendingRequests: z.object({
            count: z.number().int(),
            oldestCreatedAt: z.iso.datetime().nullable(),
        }),
        outToday: z.object({
            count: z.number().int(),
            people: z.array(PersonSchema),
            laterThisWeek: z.number().int(),
        }),
        reviewsDue: z.object({
            upcoming: z.number().int(),
            overdue: z.number().int(),
        }),
        movements: z.object({
            joining: z.number().int(),
            leaving: z.number().int(),
            next: z
                .object({
                    kind: z.enum(['JOINING', 'LEAVING']),
                    movedAt: z.iso.date(),
                    employeeId: z.uuid(),
                    person: PersonSchema,
                })
                .nullable(),
        }),
    }),
) {}

const EmployeeSchema = z.object({
    id: z.uuid(),
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
        startsAt: z.iso.date(),
        endsAt: z.iso.date(),
        days: z.number().int(),
        createdAt: z.iso.datetime(),
        employee: EmployeeSchema,
    })
    .meta({ id: 'DashboardRequest' });

const DashboardReviewSchema = z
    .object({
        id: z.uuid(),
        title: z.string(),
        reviewedAt: z.iso.date(),
        status: z.enum(['SCHEDULED', 'COMPLETED']),
        employee: EmployeeSchema,
    })
    .meta({ id: 'DashboardReview' });

const DashboardBirthdaySchema = z
    .object({
        month: z.number().int().min(1).max(MONTHS_PER_YEAR),
        day: z.number().int().min(1).max(MAX_DAYS_IN_MONTH),
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
