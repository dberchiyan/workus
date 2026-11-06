import { z } from 'zod';

/** `PageResponse<T>` — content and the total, nothing else (api.md → Pagination). */
export const pageResponseSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    content: z.array(item),
    totalElements: z.number().int().min(0),
  });
