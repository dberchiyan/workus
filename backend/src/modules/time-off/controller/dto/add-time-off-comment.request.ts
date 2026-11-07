import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TIME_OFF_COMMENT_MAX = 1000;

export const AddTimeOffCommentRequestSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'validation.timeOffComment.required')
    .max(TIME_OFF_COMMENT_MAX, 'validation.timeOffComment.tooLong'),
});

export class AddTimeOffCommentRequest extends createZodDto(AddTimeOffCommentRequestSchema) {}
