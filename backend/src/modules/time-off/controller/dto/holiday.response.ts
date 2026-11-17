import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HolidaySchema = z
    .object({
        id: z.uuid(),
        heldAt: z.iso.date(),
        name: z.string(),
        /** Copied to the same day of the next year. */
        isRecurring: z.boolean(),
        /** Its copy for the next year has been made (later edits do not reach it). */
        isCarriedOver: z.boolean(),
        version: z.number().int(),
    })
    .meta({ id: 'Holiday' });

export class HolidayResponse extends createZodDto(z.object(HolidaySchema.shape)) {}

export class HolidayListResponse extends createZodDto(z.object({ content: z.array(HolidaySchema).max(400) })) {}
