import { z } from 'zod';

export const MoneySchema = z
  .object({
    /** Decimal string with four places, e.g. "4500.0000". */
    amount: z.string().regex(/^-?\d{1,15}\.\d{4}$/),
    currency: z.string().length(3),
  })
  .meta({ id: 'Money' });
