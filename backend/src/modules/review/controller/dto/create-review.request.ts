import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { REVIEW_STATUSES, ReviewStatus } from '../../service/review-status';
import { RichTextDocSchema } from '../../service/rich-text';

export const TITLE_MAX_LENGTH = 150;
export const MAX_RESPONSIBLES = 10;

/** Monthly salary in USD: a decimal string with up to two places, never a JS number. */
const SALARY_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

/** Rich text (TipTap document); null or absent → no feedback from that source. */
const feedback = RichTextDocSchema.nullable().optional();

export const ReviewStatusSchema = z.enum(REVIEW_STATUSES).meta({ id: 'ReviewStatus' });

const ReviewFieldsSchema = z.object({
  title: z
    .string({ error: 'validation.title.required' })
    .trim()
    .min(1, 'validation.title.required')
    .max(TITLE_MAX_LENGTH, 'validation.title.tooLong'),
  date: z.iso.date('validation.reviewDate.invalid'),
  status: z.enum(REVIEW_STATUSES, { error: 'validation.reviewStatus.required' }),
  salary: z
    .string()
    .trim()
    .max(16, 'validation.salary.invalid')
    .regex(SALARY_PATTERN, 'validation.salary.invalid')
    .refine((value) => /[1-9]/.test(value), 'validation.salary.invalid')
    .optional(),
  responsibleUserIds: z
    .array(z.uuid('validation.invalid'))
    .min(1, 'validation.responsibles.required')
    .max(MAX_RESPONSIBLES, 'validation.responsibles.tooMany'),
  feedback: z
    .object({ hr: feedback, teamLead: feedback, team: feedback, client: feedback })
    .default({}),
});

/** A completed review always records the salary (also a CHECK in the database). */
const salaryForCompleted = (
  review: { status: string; salary?: string | undefined },
  context: z.RefinementCtx,
): void => {
  if (review.status === ReviewStatus.COMPLETED && !review.salary) {
    context.addIssue({
      code: 'custom',
      path: ['salary'],
      message: 'validation.salary.requiredForCompleted',
    });
  }
};

export const CreateReviewRequestSchema = ReviewFieldsSchema.superRefine(salaryForCompleted);

export class CreateReviewRequest extends createZodDto(CreateReviewRequestSchema) {}

export const UpdateReviewRequestSchema = ReviewFieldsSchema.extend({
  /** The version the client read; a stale one is 409 CONCURRENT_MODIFICATION. */
  version: z.number().int().min(0),
}).superRefine(salaryForCompleted);

export class UpdateReviewRequest extends createZodDto(UpdateReviewRequestSchema) {}
