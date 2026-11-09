import { z } from 'zod';

/** Mirrored by `users.first_name` / `users.last_name` (VARCHAR(100)). */
export const PERSON_NAME_MAX_LENGTH = 100;

/** A first or last name: trimmed, required, ≤ 100 (sign-up, adding people, renaming oneself). */
export const personName = (field: 'firstName' | 'lastName') =>
  z
    .string({ error: `validation.${field}.required` })
    .trim()
    .min(1, `validation.${field}.required`)
    .max(PERSON_NAME_MAX_LENGTH, `validation.${field}.tooLong`);
