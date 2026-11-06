/** `YYYY-MM-DD` → localised date (UTC, so the day never shifts). */
export const formatReviewDate = (
  isoDate: string,
  locale: string,
  style: 'medium' | 'monthYear' = 'medium',
): string =>
  new Intl.DateTimeFormat(
    locale,
    style === 'monthYear'
      ? { month: 'short', year: 'numeric', timeZone: 'UTC' }
      : { dateStyle: 'medium', timeZone: 'UTC' },
  ).format(new Date(`${isoDate}T00:00:00Z`));

/** "12.0" → "+12.0%" in the locale (a percentage, not money — a number is fine here). */
export const formatPercentChange = (percent: string, locale: string): string =>
  new Intl.NumberFormat(locale, {
    style: 'percent',
    signDisplay: 'exceptZero',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(percent) / 100);
