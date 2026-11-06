/**
 * TEMPORARY front-end mock for profile data the API does not have yet (level, birthday,
 * equipment, files). Leave balances come from the time-off API. Deterministic per employee,
 * so a person looks the same on every visit. Replace each part with an API field as it lands;
 * delete this file when nothing uses it.
 */

export interface EmployeeProfileMock {
  level: string;
  dateOfBirth: string;
  laptopId: string;
  additionalInfo: string | null;
  fileCount: number;
}

const LEVELS = ['Junior Employee', 'Middle Employee', 'Senior Employee', 'Lead'] as const;
const NOTES = [
  null,
  'Prefers remote work on Fridays.',
  null,
  'Speaks at internal tech talks.',
] as const;

/** Stable 32-bit hash of the id → a pseudo-random sequence. */
const seeded = (id: string): (() => number) => {
  let state = 0;
  for (const char of id) {
    state = (state * 31 + char.charCodeAt(0)) >>> 0;
  }
  return () => {
    state = (state * 1_103_515_245 + 12_345) >>> 0;
    return state / 0x1_0000_0000;
  };
};

const pick = <T>(items: readonly T[], next: () => number): T =>
  items[Math.floor(next() * items.length)] as T;

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const mockEmployeeProfile = (employeeId: string): EmployeeProfileMock => {
  const next = seeded(employeeId);
  const birthYear = 1980 + Math.floor(next() * 22);
  const birthday = new Date(
    Date.UTC(birthYear, Math.floor(next() * 12), 1 + Math.floor(next() * 28)),
  );
  return {
    level: pick(LEVELS, next),
    dateOfBirth: isoDate(birthday),
    laptopId: String(1000 + Math.floor(next() * 9000)),
    additionalInfo: pick(NOTES, next),
    fileCount: 0,
  };
};
