import { z } from 'zod';

/** Why an employee left; mirrored by ck_employees_termination_reason. OTHER needs a comment. */
export const TerminationReason = {
  RESIGNATION: 'RESIGNATION',
  DISMISSAL: 'DISMISSAL',
  END_OF_CONTRACT: 'END_OF_CONTRACT',
  LAYOFF: 'LAYOFF',
  OTHER: 'OTHER',
} as const;
export type TerminationReason = (typeof TerminationReason)[keyof typeof TerminationReason];

export const TERMINATION_REASONS = Object.values(TerminationReason) as [
  TerminationReason,
  ...TerminationReason[],
];

export const isTerminationReason = (value: string): value is TerminationReason =>
  (TERMINATION_REASONS as readonly string[]).includes(value);

/** One schema (one OpenAPI name) for requests and responses. */
export const TerminationReasonSchema = z
  .enum(TERMINATION_REASONS, { error: 'validation.terminationReason.required' })
  .meta({ id: 'TerminationReason' });
