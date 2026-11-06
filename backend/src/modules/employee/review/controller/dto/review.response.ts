import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MoneySchema } from '../../../../../common/dto/money';
import { RichTextDocSchema } from '../../service/rich-text';
import { REVIEW_KINDS } from '../../service/review-kind';
import { ReviewStatusSchema } from './create-review.request';

export const ReviewKindSchema = z.enum(REVIEW_KINDS).meta({ id: 'ReviewKind' });

export const ReviewSchema = z
  .object({
    id: z.uuid(),
    /** STARTING: the salary at hire — dated the start date, always completed, cannot be deleted. */
    kind: ReviewKindSchema,
    title: z.string(),
    date: z.iso.date(),
    status: ReviewStatusSchema,
    /** New monthly salary agreed in the review; null when not recorded. */
    salary: MoneySchema.nullable(),
    responsibles: z.array(z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string() })),
    /** Rich-text documents (TipTap JSON); null when that source gave no feedback. */
    feedback: z.object({
      hr: RichTextDocSchema.nullable(),
      teamLead: RichTextDocSchema.nullable(),
      team: RichTextDocSchema.nullable(),
      client: RichTextDocSchema.nullable(),
    }),
    createdAt: z.iso.datetime(),
    /** Send back on update (optimistic locking). */
    version: z.number().int().min(0),
  })
  .meta({ id: 'Review' });

export class EmployeeReviewsResponse extends createZodDto(
  z.object({
    salary: z.object({
      current: MoneySchema.nullable(),
      previous: MoneySchema.nullable(),
      /** Percent vs the previous completed review, one decimal, e.g. "12.5". */
      changePercent: z.string().nullable(),
      /** Completed reviews, oldest first. */
      history: z.array(z.object({ date: z.iso.date(), salary: MoneySchema })),
    }),
    content: z.array(ReviewSchema),
  }),
) {}

export class ReviewResponse extends createZodDto(z.object(ReviewSchema.shape)) {}
