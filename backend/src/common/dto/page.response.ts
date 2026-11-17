import { z } from 'zod';

/** `PageResponse<T>` — content and the total, nothing else (api.md → Pagination). */
export const pageResponseSchema = <T extends z.ZodType>(
    item: T,
): z.ZodObject<{ content: z.ZodArray<T>; totalElements: z.ZodNumber }> =>
    z.object({
        content: z.array(item),
        totalElements: z.number().int().min(0),
    });
