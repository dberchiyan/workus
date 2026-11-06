/** `YYYY-MM-DD` → a localised calendar date (UTC, so the day never shifts). */
export const formatCalendarDate = (isoDate: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );

export const formatCount = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale).format(value);

const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;

/** Tenure in whole days → "11 months" under a year, "1.8 years" from a year on. */
export const formatTenure = (days: number, locale: string): string =>
  days < DAYS_PER_YEAR
    ? new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'month',
        unitDisplay: 'long',
        maximumFractionDigits: 0,
      }).format(Math.max(0, Math.round(days / DAYS_PER_MONTH)))
    : new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'year',
        unitDisplay: 'long',
        maximumFractionDigits: 1,
      }).format(days / DAYS_PER_YEAR);

/** Whole years and remaining months between two `YYYY-MM-DD` dates (from ≤ to). */
export const yearsAndMonthsBetween = (
  from: string,
  to: string,
): { years: number; months: number } => {
  const [fy, fm, fd] = from.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = to.split('-').map(Number) as [number, number, number];
  let months = (ty - fy) * 12 + (tm - fm) - (td < fd ? 1 : 0);
  months = Math.max(0, months);
  return { years: Math.floor(months / 12), months: months % 12 };
};

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** `YYYY-MM-DD` plus whole months. */
export const addMonthsIso = (isoDate: string, months: number): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
};
