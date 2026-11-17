import { MONTHS_PER_YEAR } from '@/shared/lib/units';

const MIN_TICKS = 4;
const DECIMAL_BASE = 10;
const HALF_STEP = 2.5;
const MID_STEP = 5;
const NICE_FACTORS = [1, 2, HALF_STEP, MID_STEP, DECIMAL_BASE];
const ANY_YEAR = 2026;
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
        return { max: MIN_TICKS, ticks: Array.from({ length: MIN_TICKS + 1 }, (_, tick) => tick) };
    }
    const rough = maximum / MIN_TICKS;
    const power = DECIMAL_BASE ** Math.floor(Math.log10(rough));
    const step =
        NICE_FACTORS.map((factor) => factor * power).find((candidate) => candidate >= rough) ?? DECIMAL_BASE * power;
    const whole = Math.max(1, Math.ceil(step));
    const max = Math.ceil(maximum / whole) * whole;
    return { max, ticks: Array.from({ length: max / whole + 1 }, (_, index) => index * whole) };
};

/** Short month names of the locale, January first. */
export const monthLabels = (locale: string, width: 'narrow' | 'short' | 'long' = 'short'): string[] => {
    const format = new Intl.DateTimeFormat(locale, { month: width, timeZone: 'UTC' });
    return Array.from({ length: MONTHS_PER_YEAR }, (_, index) => format.format(new Date(Date.UTC(ANY_YEAR, index, 1))));
};

/** "3 y 2 m"-style text needs i18n; this gives the parts. */
export const yearsAndMonths = (months: number): { years: number; months: number } => ({
    years: Math.floor(months / MONTHS_PER_YEAR),
    months: months % MONTHS_PER_YEAR,
});

/** A change with its sign from the locale ("+3", "−1.5"; zero unsigned), up to one decimal. */
export const signed = (value: number, locale: string): string =>
    new Intl.NumberFormat(locale, { signDisplay: 'exceptZero', maximumFractionDigits: 1 }).format(value);
