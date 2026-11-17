import { z } from 'zod';

import { CURRENCY_CODE_LENGTH, MAX_AMOUNT_INPUT_LENGTH } from './limits';

export const MoneySchema = z
    .object({
        /** Decimal string with four places, e.g. "4500.0000". */
        amount: z.string().regex(/^-?\d{1,15}\.\d{4}$/),
        currency: z.string().length(CURRENCY_CODE_LENGTH),
    })
    .meta({ id: 'Money' });

/** Amount typed by a person: a positive decimal string with up to two places, never a JS number. */
export const AmountInputSchema = z
    .string()
    .trim()
    .max(MAX_AMOUNT_INPUT_LENGTH, 'validation.salary.invalid')
    .regex(/^\d{1,13}(\.\d{1,2})?$/, 'validation.salary.invalid')
    .refine((value) => /[1-9]/.test(value), 'validation.salary.invalid');
