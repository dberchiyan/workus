import { type Money, toUnits } from '@/shared/lib/money';
import { ISO_DAY_LENGTH, PER_MILLE } from '@/shared/lib/units';

export const fullName = (person: { firstName: string; lastName: string }): string =>
    `${person.firstName} ${person.lastName}`;

/** UTC calendar day of an instant, `YYYY-MM-DD` — groups events by day (UTC, as everywhere). */
const HUNDREDTHS_OF_PERCENT = 10_000n;
const HALF = 5n;
const TENTH = 10n;

export const dayKey = (instant: Date): string => instant.toISOString().slice(0, ISO_DAY_LENGTH);

export const formatDayHeading = (instant: Date, locale: string): string =>
    new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(instant);

export const formatTime = (instant: Date, locale: string): string =>
    new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'UTC' }).format(instant);

export const formatDateTime = (instant: Date, locale: string): string =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'long', timeZone: 'UTC' }).format(instant);

/**
 * Salary change as a signed percentage text ("+8.2%"); null across currencies or from zero.
 * Computed exactly in tenths of a percent with BigInt, rounded half up.
 */
export const formatSalaryChange = (from: Money, to: Money, locale: string): string | null => {
    const before = toUnits(from.amount);
    if (from.currency !== to.currency || before === 0n) {
        return null;
    }
    const scaled = ((toUnits(to.amount) - before) * HUNDREDTHS_OF_PERCENT) / before;
    const tenths = (scaled + (scaled >= 0n ? HALF : -HALF)) / TENTH;
    // A display ratio, not an amount: a float is fine here.
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
    }).format(Number(tenths) / PER_MILLE);
};
