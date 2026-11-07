/** Series colours in fixed order (theme `chart` palette); literal names so Tailwind sees them. */
export const SERIES = [
  'bg-chart-c1',
  'bg-chart-c2',
  'bg-chart-c3',
  'bg-chart-c4',
  'bg-chart-c5',
  'bg-chart-c6',
  'bg-chart-c7',
  'bg-chart-c8',
] as const;

/** A group keeps its colour by its place in the full list, never by rank after filtering. */
export const seriesClass = (index: number): string => SERIES[index % SERIES.length] ?? SERIES[0];

/** A rounded axis top and 4–5 evenly spaced ticks from 0 (1, 2, 2.5, 5 × 10ⁿ steps). */
export const niceScale = (maximum: number): { max: number; ticks: number[] } => {
  if (maximum <= 0) {
    return { max: 4, ticks: [0, 1, 2, 3, 4] };
  }
  const rough = maximum / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= rough) ??
    10 * power;
  // Whole people / days: never a fractional step.
  const whole = Math.max(1, Math.ceil(step));
  const max = Math.ceil(maximum / whole) * whole;
  return { max, ticks: Array.from({ length: max / whole + 1 }, (_, index) => index * whole) };
};

/** Short month names of the locale, January first. */
export const monthLabels = (
  locale: string,
  width: 'narrow' | 'short' | 'long' = 'short',
): string[] => {
  const format = new Intl.DateTimeFormat(locale, { month: width, timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, index) =>
    format.format(new Date(Date.UTC(2026, index, 1))),
  );
};

/** "3 y 2 m"-style text needs i18n; this gives the parts. */
export const yearsAndMonths = (months: number): { years: number; months: number } => ({
  years: Math.floor(months / 12),
  months: months % 12,
});
