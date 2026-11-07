/** "26 Jun 2026" for a `YYYY-MM-DD` calendar date (UTC, so the day never shifts). */
export const formatDay = (isoDate: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));

/** "26–30 Jun 2026", "30 Jun – 2 Jul 2026" or one day; Intl merges what the dates share. */
export const formatPeriod = (start: string, end: string, locale: string): string => {
  const format = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const from = new Date(`${start}T00:00:00Z`);
  return start === end
    ? format.format(from)
    : format.formatRange(from, new Date(`${end}T00:00:00Z`));
};

/** "17 Jun 2026, 1:54 AM" in UTC (as every time in the app). */
export const formatDateTime = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));

export const formatCount = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale).format(value);

export const fullName = (person: { firstName: string; lastName: string }): string =>
  `${person.firstName} ${person.lastName}`;

/** Mon–Fri days in [start, end] that are not company holidays — the server's rule. */
export const workingDaysBetween = (
  start: string,
  end: string,
  holidays: ReadonlySet<string> | ReadonlyMap<string, unknown> = new Set(),
): number => {
  const DAY_MS = 86_400_000;
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from || to - from > 366 * DAY_MS) {
    return 0;
  }
  let days = 0;
  for (let day = from; day <= to; day += DAY_MS) {
    const weekday = new Date(day).getUTCDay();
    const iso = new Date(day).toISOString().slice(0, 10);
    if (weekday !== 0 && weekday !== 6 && !holidays.has(iso)) {
      days += 1;
    }
  }
  return days;
};

const DAY_MS = 86_400_000;

/** Whole days from an instant to `now` (never negative). */
export const daysSince = (iso: string, now: number): number =>
  Math.max(0, Math.floor((now - Date.parse(iso)) / DAY_MS));
