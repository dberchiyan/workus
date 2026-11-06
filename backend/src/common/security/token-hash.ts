import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_BYTES = 32;

export const generateToken = (): string => randomBytes(TOKEN_BYTES).toString('base64url');

/** SHA-256 hex — only hashes of session and CSRF tokens are stored. */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const tokenMatchesHash = (token: string, expectedHash: string): boolean => {
  const actual = Buffer.from(hashToken(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
