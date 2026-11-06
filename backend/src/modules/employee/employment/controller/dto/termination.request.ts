import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  TerminationReason,
  TerminationReasonSchema,
} from '../../../core/service/termination-reason';

export const COMMENT_MAX_LENGTH = 500;

export class TerminateEmployeeRequest extends createZodDto(
  z
    .object({
      /** Terminated from this date (inclusive); a future date plans the leave. */
      date: z.iso.date('validation.terminationDate.invalid'),
      reason: TerminationReasonSchema,
      /** Blank → none. Required when the reason is OTHER. */
      comment: z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z
          .string()
          .trim()
          .max(COMMENT_MAX_LENGTH, 'validation.terminationComment.tooLong')
          .optional(),
      ),
      /** The version the client read; a stale one is 409 CONCURRENT_MODIFICATION. */
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
    /** The version the client read; a stale one is 409 CONCURRENT_MODIFICATION. */
    version: z.number().int().min(0),
  }),
) {}
