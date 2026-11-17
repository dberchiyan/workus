import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_YEAR, MIN_YEAR } from '../../../../common/dto/limits';

export const HOLIDAY_NAME_MAX = 100;

const holidayFields = {
    heldAt: z.iso.date('validation.holiday.date'),
    name: z
        .string({ error: 'validation.holiday.nameRequired' })
        .trim()
        .min(1, 'validation.holiday.nameRequired')
        .max(HOLIDAY_NAME_MAX, 'validation.holiday.nameTooLong'),
    /** Copied to the same day of the next year. */
    isRecurring: z.boolean({ error: 'validation.invalid' }),
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
            .min(MIN_YEAR, 'validation.invalid')
            .max(MAX_YEAR, 'validation.invalid'),
    }),
) {}
