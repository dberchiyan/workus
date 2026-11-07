import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Mirrored by the decision_comment column (VARCHAR(500)). */
export const DECISION_COMMENT_MAX_LENGTH = 500;

export const RejectTimeOffRequestRequestSchema = z.object({
  /** Why it is rejected (optional); the employee sees it. Blank → none. */
  comment: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .trim()
      .max(DECISION_COMMENT_MAX_LENGTH, 'validation.decisionComment.tooLong')
      .optional(),
  ),
});

export class RejectTimeOffRequestRequest extends createZodDto(RejectTimeOffRequestRequestSchema) {}
