import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MoneySchema } from '../../../../common/dto/money';

const GroupSchema = z.object({ id: z.uuid(), name: z.string() }).meta({ id: 'InsightGroup' });

const PersonSchema = z
    .object({
        employeeId: z.uuid(),
        userId: z.uuid(),
        firstName: z.string(),
        lastName: z.string(),
        positionTitle: z.string(),
    })
    .meta({ id: 'InsightPerson' });

const HeadcountSchema = z.object({
    groups: z.array(GroupSchema),
    months: z.array(z.object({ month: z.number().int(), counts: z.array(z.number().int()).nullable() })),
    current: z.number().int(),
    previous: z.number().int(),
});

const TenureFigureSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    averageMonths: z.number().int(),
    employees: z.number().int(),
});

const TenureSchema = z.object({
    averageMonths: z.number().int().nullable(),
    previousAverageMonths: z.number().int().nullable(),
    groups: z.array(TenureFigureSchema.extend({ items: z.array(TenureFigureSchema) })),
});

const MovementSchema = PersonSchema.extend({ movedAt: z.iso.date() });

const TurnoverSchema = z.object({
    months: z.array(
        z.object({
            month: z.number().int(),
            hired: z.array(MovementSchema),
            left: z.array(MovementSchema),
        }),
    ),
    hiredTotal: z.number().int(),
    leftTotal: z.number().int(),
    rate: z.number().min(0).nullable(),
    previousRate: z.number().min(0).nullable(),
});

const AbsenceSchema = z.object({
    top: z.array(
        z.object({
            person: PersonSchema,
            days: z.number().int(),
            byType: z.object({
                VACATION: z.number().int(),
                SICK_DAY: z.number().int(),
                DAY_OFF: z.number().int(),
            }),
        }),
    ),
    averageDays: z.number().min(0).nullable(),
    previousAverageDays: z.number().min(0).nullable(),
});

const SalarySchema = z.object({
    average: MoneySchema.nullable(),
    previousAverage: MoneySchema.nullable(),
    groups: z.array(GroupSchema.extend({ average: MoneySchema, employees: z.number().int() })),
});

export class InsightsResponse extends createZodDto(
    z.object({
        headcount: HeadcountSchema,
        tenure: TenureSchema,
        turnover: TurnoverSchema,
        absence: AbsenceSchema,
        salary: SalarySchema,
    }),
) {}
