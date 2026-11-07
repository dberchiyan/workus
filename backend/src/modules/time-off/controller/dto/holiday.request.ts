import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HOLIDAY_NAME_MAX = 100;

const holidayFields = {
  date: z.iso.date('validation.holiday.date'),
  name: z
    .string({ error: 'validation.holiday.nameRequired' })
    .trim()
    .min(1, 'validation.holiday.nameRequired')
    .max(HOLIDAY_NAME_MAX, 'validation.holiday.nameTooLong'),
  /** Copied to the same day of the next year. */
  recurring: z.boolean({ error: 'validation.invalid' }),
};

export class CreateHolidayRequest extends createZodDto(z.object(holidayFields)) {}

export class UpdateHolidayRequest extends createZodDto(
  z.object({ ...holidayFields, version: z.number().int().min(0) }),
) {}

export class HolidayYearQuery extends createZodDto(
  z.object({
    year: z.coerce
      .number({ error: 'validation.invalid' })
      .int('validation.invalid')
      .min(2000, 'validation.invalid')
      .max(2100, 'validation.invalid'),
  }),
) {}
