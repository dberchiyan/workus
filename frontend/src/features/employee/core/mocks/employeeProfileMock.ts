/**
 * TEMPORARY front-end mock for profile data the API does not have yet (level, birthday,
 * equipment, leave balances, history, files). Deterministic per employee,
 * so a person looks the same on every visit. Replace each part with an API field as it lands;
 * delete this file when nothing uses it.
 */

export interface LeaveBalance {
  cycleStart: string;
  cycleEnd: string;
  available: number | null;
  used: number;
}

export interface EmployeeProfileMock {
  level: string;
  dateOfBirth: string;
  laptopId: string;
  additionalInfo: string | null;
  vacation: LeaveBalance;
  daysOff: LeaveBalance;
  sickDays: LeaveBalance;
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

const addMonths = (iso: string, months: number): Date => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
};

/** The cycle (of `months` length, counted from the start date) that contains today. */
const currentCycle = (
  startDate: string,
  months: number,
): { cycleStart: string; cycleEnd: string } => {
  const today = new Date();
  let start = new Date(`${startDate}T00:00:00Z`);
  while (addMonths(isoDate(start), months) <= today) {
    start = addMonths(isoDate(start), months);
  }
  const end = addMonths(isoDate(start), months);
  end.setUTCDate(end.getUTCDate() - 1);
  return { cycleStart: isoDate(start), cycleEnd: isoDate(end) };
};

export const mockEmployeeProfile = (employeeId: string, startDate: string): EmployeeProfileMock => {
  const next = seeded(employeeId);
  const birthYear = 1980 + Math.floor(next() * 22);
  const birthday = new Date(
    Date.UTC(birthYear, Math.floor(next() * 12), 1 + Math.floor(next() * 28)),
  );
  const vacationUsed = Math.floor(next() * 8);
  const sickUsed = Math.floor(next() * 4);
  return {
    level: pick(LEVELS, next),
    dateOfBirth: isoDate(birthday),
    laptopId: String(1000 + Math.floor(next() * 9000)),
    additionalInfo: pick(NOTES, next),
    vacation: {
      ...currentCycle(startDate, 6),
      available: 10 - Math.min(vacationUsed, 10),
      used: vacationUsed,
    },
    daysOff: { ...currentCycle(startDate, 12), available: null, used: Math.floor(next() * 3) },
    sickDays: {
      ...currentCycle(startDate, 12),
      available: 5 - Math.min(sickUsed, 5),
      used: sickUsed,
    },
    fileCount: 0,
  };
};
