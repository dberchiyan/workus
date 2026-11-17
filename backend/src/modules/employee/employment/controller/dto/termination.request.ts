import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TerminationReason, TerminationReasonSchema } from '../../../core/service/termination-reason';

export const COMMENT_MAX_LENGTH = 500;

export class TerminateEmployeeRequest extends createZodDto(
    z
        .object({
            terminatedAt: z.iso.date('validation.terminationDate.invalid'),
            reason: TerminationReasonSchema,
            comment: z.preprocess(
                (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
                z.string().trim().max(COMMENT_MAX_LENGTH, 'validation.terminationComment.tooLong').optional(),
            ),
            version: z.number().int().min(0),
        })
        .superRefine((request, context) => {
            if (request.reason === TerminationReason.OTHER && !request.comment) {
                context.addIssue({
                    code: 'custom',
                    path: ['comment'],
                    message: 'validation.terminationComment.requiredForOther',
                });
            }
        }),
) {}

export class CancelTerminationRequest extends createZodDto(
    z.object({
        version: z.number().int().min(0),
    }),
) {}
