/** Calendar dates as `YYYY-MM-DD` strings; maths in UTC so a day never shifts. */

const DAY_MS = 86_400_000;
const toDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date): string => date.toISOString().slice(0, 10);

export const addDaysIso = (iso: string, days: number): string =>
  toIso(new Date(toDate(iso).getTime() + days * DAY_MS));

/** Calendar months later; the day is clamped to the month's length. */
export const addMonthsIso = (iso: string, months: number): string => {
  const date = toDate(iso);
  const total = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(total / 12);
  const month = total % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return toIso(new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay))));
};

export const isWeekendIso = (iso: string): boolean => {
  const day = toDate(iso).getUTCDay();
  return day === 0 || day === 6;
};

/** Today in the viewer's time zone. */
export const todayIsoLocal = (): string => {
  const now = new Date();
  return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
};

/** Sunday-first for English (as in the US), Monday-first otherwise. */
const firstDayOfWeek = (locale: string): number => (locale.startsWith('en') ? 0 : 1);

/** Weeks of `YYYY-MM` (null = padding before the 1st / after the last day) and weekday labels. */
export const monthGrid = (month: string, locale: string) => {
  const first = toDate(`${month}-01`);
  const firstDay = firstDayOfWeek(locale);
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const lead = (first.getUTCDay() - firstDay + 7) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => addDaysIso(`${month}-01`, index)),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  const weeks = Array.from({ length: cells.length / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7),
  );
  // 2023-01-01 was a Sunday: offset from it for each column's weekday.
  const short = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
  const labels = Array.from({ length: 7 }, (_, column) => {
    const date = toDate(addDaysIso('2023-01-01', (column + firstDay) % 7));
    return { short: short.format(date), long: long.format(date) };
  });
  return { weeks, weekdays: { firstDay, labels } };
};
