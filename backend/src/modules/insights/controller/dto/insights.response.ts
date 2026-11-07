import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MoneySchema } from '../../../../common/dto/money';

const GroupSchema = z.object({ id: z.uuid(), name: z.string() }).meta({ id: 'InsightGroup' });

const PersonSchema = z
  .object({
    employeeId: z.uuid(),
    /** For the avatar colour. */
    userId: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    positionTitle: z.string(),
  })
  .meta({ id: 'InsightPerson' });

export class HeadcountResponse extends createZodDto(
  z.object({
    /** Categories, or the positions of the chosen category; only those with anyone this year. */
    groups: z.array(GroupSchema),
    /** Twelve months; `counts` follow `groups`; null for months that have not started. */
    months: z.array(
      z.object({ month: z.number().int(), counts: z.array(z.number().int()).nullable() }),
    ),
    /** Employed at the end of the year (today, this year). */
    current: z.number().int(),
    /** Employed at the end of the previous year. */
    previous: z.number().int(),
  }),
) {}

const TenureFigureSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  /** Whole months, averaged and rounded. */
  averageMonths: z.number().int(),
  employees: z.number().int(),
});

export class TenureResponse extends createZodDto(
  z.object({
    averageMonths: z.number().int().nullable(),
    previousAverageMonths: z.number().int().nullable(),
    /** Categories with their positions. */
    groups: z.array(TenureFigureSchema.extend({ items: z.array(TenureFigureSchema) })),
  }),
) {}

const MovementSchema = PersonSchema.extend({ date: z.iso.date() });

export class TurnoverResponse extends createZodDto(
  z.object({
    months: z.array(
      z.object({
        month: z.number().int(),
        hired: z.array(MovementSchema),
        left: z.array(MovementSchema),
      }),
    ),
    hiredTotal: z.number().int(),
    leftTotal: z.number().int(),
    /** People who left ÷ average month-end headcount × 100, one decimal. */
    // `.min(0)`: nestjs-zod writes a bare nullable number as an array in OpenAPI 3.0.
    rate: z.number().min(0).nullable(),
    previousRate: z.number().min(0).nullable(),
  }),
) {}

export class AbsenceResponse extends createZodDto(
  z.object({
    /** The ten people with the most approved working days off, most first. */
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
    /** Approved working days off per person employed at the end of the period. */
    averageDays: z.number().min(0).nullable(),
    previousAverageDays: z.number().min(0).nullable(),
  }),
) {}

export class SalaryResponse extends createZodDto(
  z.object({
    /** Average monthly salary (latest completed review) of the people employed then. */
    average: MoneySchema.nullable(),
    previousAverage: MoneySchema.nullable(),
    /** Highest average first. */
    groups: z.array(GroupSchema.extend({ average: MoneySchema, employees: z.number().int() })),
  }),
) {}
