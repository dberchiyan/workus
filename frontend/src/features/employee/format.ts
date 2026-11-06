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
