import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MoneySchema } from '../../../../../common/dto/money';
import { REVIEW_KINDS } from '../../service/review-kind';
import { RichTextDocSchema } from '../../service/rich-text';
import { ReviewStatusSchema } from './create-review.request';

export const ReviewKindSchema = z.enum(REVIEW_KINDS).meta({ id: 'ReviewKind' });

export const ReviewSchema = z
    .object({
        id: z.uuid(),
        kind: ReviewKindSchema,
        title: z.string(),
        reviewedAt: z.iso.date(),
        status: ReviewStatusSchema,
        salary: MoneySchema.nullable(),
        responsibles: z.array(z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string() })),
        feedback: z.object({
            hr: RichTextDocSchema.nullable(),
            teamLead: RichTextDocSchema.nullable(),
            team: RichTextDocSchema.nullable(),
            client: RichTextDocSchema.nullable(),
        }),
        createdAt: z.iso.datetime(),
        version: z.number().int().min(0),
    })
    .meta({ id: 'Review' });

export class EmployeeReviewsResponse extends createZodDto(
    z.object({
        salary: z.object({
            current: MoneySchema.nullable(),
            previous: MoneySchema.nullable(),
            changePercent: z.string().nullable(),
            history: z.array(z.object({ reviewedAt: z.iso.date(), salary: MoneySchema })),
        }),
        content: z.array(ReviewSchema),
    }),
) {}

export class ReviewResponse extends createZodDto(z.object(ReviewSchema.shape)) {}
