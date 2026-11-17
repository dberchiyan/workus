import { isoDay } from '../../../common/time/iso-day';
import { MONTHS_PER_YEAR, SATURDAY, SUNDAY } from '../../../common/time/units';
import { TimeOffType } from './time-off-type';

export const LEAVE_POLICY: Readonly<Record<TimeOffType, { cycleMonths: number; allowance: number | null }>> = {
    [TimeOffType.VACATION]: { cycleMonths: 6, allowance: 10 },
    [TimeOffType.SICK_DAY]: { cycleMonths: 12, allowance: 5 },
    [TimeOffType.DAY_OFF]: { cycleMonths: 12, allowance: null },
};

const DAY_MS = 86_400_000;

/** Today as a UTC calendar date (midnight UTC), matching `@db.Date` values. */
export const todayUtc = (): Date => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

export const plusDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

/** Calendar months later; the day is clamped to the month's length (31 Jan + 1 → 28/29 Feb). */
export const plusMonths = (date: Date, months: number): Date => {
    const total = date.getUTCFullYear() * MONTHS_PER_YEAR + date.getUTCMonth() + months;
    const year = Math.floor(total / MONTHS_PER_YEAR);
    const month = total % MONTHS_PER_YEAR;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
};

/** The cycle (start, last day — inclusive) of `months` counted from `origin` that holds `date`. */
export const cycleOf = (origin: Date, months: number, date: Date): { start: Date; end: Date } => {
    const monthsSince =
        (date.getUTCFullYear() - origin.getUTCFullYear()) * MONTHS_PER_YEAR + date.getUTCMonth() - origin.getUTCMonth();
    let index = Math.max(0, Math.floor(monthsSince / months));
    if (plusMonths(origin, index * months) > date) {
        index = Math.max(0, index - 1);
    }
    const start = plusMonths(origin, index * months);
    return { start, end: plusDays(plusMonths(origin, (index + 1) * months), -1) };
};

export { isoDay };

export const isWeekday = (date: Date): boolean => {
    const weekday = date.getUTCDay();
    return weekday !== SUNDAY && weekday !== SATURDAY;
};

/** Mon–Fri days in [start, end] that are not company holidays (`YYYY-MM-DD`). */
export const workingDaysBetween = (start: Date, end: Date, holidays: ReadonlySet<string> = new Set()): number => {
    let days = 0;
    for (let day = start; day <= end; day = plusDays(day, 1)) {
        if (isWeekday(day) && !holidays.has(isoDay(day))) {
            days += 1;
        }
    }
    return days;
};
