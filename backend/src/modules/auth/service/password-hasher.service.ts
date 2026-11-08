import { randomBytes, randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Unambiguous characters only (no 0/O, 1/l/I), so a password read off a screen is typed right. */
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!#%+-=?@';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;
const TEMPORARY_LENGTH = 16;

const pick = (alphabet: string): string => alphabet.charAt(randomInt(alphabet.length));

const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** The one place passwords are hashed and verified (security.md → Passwords). */
@Injectable()
export class PasswordHasher {
  /** Verified against when the email is unknown, so timing does not reveal accounts. */
  private readonly dummyHash: Promise<string> = argon2.hash(
    randomBytes(32).toString('hex'),
    HASH_OPTIONS,
  );

  hash(password: string): Promise<string> {
    return argon2.hash(password, HASH_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  async verifyDummy(password: string): Promise<void> {
    await this.verify(await this.dummyHash, password);
  }

  /**
   * A random 16-character password that meets the password rules (an upper- and a lower-case
   * letter, a digit, a symbol) — given out once when an admin creates an account.
   */
  generateTemporary(): string {
    const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
    while (chars.length < TEMPORARY_LENGTH) {
      chars.push(pick(ALL));
    }
    // Fisher–Yates with a CSPRNG: the guaranteed classes are not always first.
    for (let index = chars.length - 1; index > 0; index -= 1) {
      const other = randomInt(index + 1);
      [chars[index], chars[other]] = [chars[other] ?? '', chars[index] ?? ''];
    }
    return chars.join('');
  }

  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, HASH_OPTIONS);
  }
}
