import { DAYS_PER_WEEK, ISO_DAY_LENGTH, MONTHS_PER_YEAR, SATURDAY, SUNDAY } from '@/shared/lib/units';

const A_SUNDAY = '2023-01-01';

const DAY_MS = 86_400_000;
const toDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date): string => date.toISOString().slice(0, ISO_DAY_LENGTH);

export const addDaysIso = (iso: string, days: number): string => toIso(new Date(toDate(iso).getTime() + days * DAY_MS));

/** Calendar months later; the day is clamped to the month's length. */
export const addMonthsIso = (iso: string, months: number): string => {
    const date = toDate(iso);
    const total = date.getUTCFullYear() * MONTHS_PER_YEAR + date.getUTCMonth() + months;
    const year = Math.floor(total / MONTHS_PER_YEAR);
    const month = total % MONTHS_PER_YEAR;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return toIso(new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay))));
};

export const isWeekendIso = (iso: string): boolean => {
    const day = toDate(iso).getUTCDay();
    return day === SUNDAY || day === SATURDAY;
};

/** Sunday-first for English (as in the US), Monday-first otherwise. */
const firstDayOfWeek = (locale: string): number => (locale.startsWith('en') ? 0 : 1);

/** Weeks of `YYYY-MM` (null = padding before the 1st / after the last day) and weekday labels. */
export const monthGrid = (
    month: string,
    locale: string,
): { weeks: (string | null)[][]; weekdays: { firstDay: number; labels: { short: string; long: string }[] } } => {
    const first = toDate(`${month}-01`);
    const firstDay = firstDayOfWeek(locale);
    const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const lead = (first.getUTCDay() - firstDay + DAYS_PER_WEEK) % DAYS_PER_WEEK;
    const cells: (string | null)[] = [
        ...Array.from({ length: lead }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => addDaysIso(`${month}-01`, index)),
    ];
    while (cells.length % DAYS_PER_WEEK !== 0) {
        cells.push(null);
    }
    const weeks = Array.from({ length: cells.length / DAYS_PER_WEEK }, (_, week) =>
        cells.slice(week * DAYS_PER_WEEK, week * DAYS_PER_WEEK + DAYS_PER_WEEK),
    );
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
    const labels = Array.from({ length: 7 }, (_, column) => {
        const date = toDate(addDaysIso(A_SUNDAY, (column + firstDay) % DAYS_PER_WEEK));
        return { short: short.format(date), long: long.format(date) };
    });
    return { weeks, weekdays: { firstDay, labels } };
};

/** Every day of `YYYY-MM`, in order. */
export const monthDays = (month: string): string[] => {
    const first = toDate(`${month}-01`);
    const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    return Array.from({ length: count }, (_, index) => addDaysIso(`${month}-01`, index));
};

export type CalendarCell<R> =
    | { kind: 'day'; date: string }
    | { kind: 'request'; request: R; date: string; span: number }
    /** Days without employment in a row: before the start date, or from the termination date. */
    | { kind: 'outside'; date: string; span: number; reason: 'before' | 'after' };

/**
 * One person's row: a cell per free day, one spanning cell per request (clipped to the month)
 * and one per run of days outside employment. Requests of one person do not overlap; if they ever did, the later one is clipped.
 */
export const calendarCells = <R extends { startsAt: string; endsAt: string }>(
    days: string[],
    requests: R[],
    employment: { startsAt: string; terminatedAt: string | null },
): CalendarCell<R>[] => {
    const first = days[0] ?? '';
    const indexOf = (iso: string) => Math.round((toDate(iso).getTime() - toDate(first).getTime()) / DAY_MS);
    const employed = (date: string) =>
        date >= employment.startsAt && (employment.terminatedAt === null || date < employment.terminatedAt);
    const freeDays = (from: number, to: number): CalendarCell<R>[] => {
        const result: CalendarCell<R>[] = [];
        for (const date of days.slice(from, to)) {
            const last = result.at(-1);
            if (employed(date)) {
                result.push({ kind: 'day', date });
            } else if (last?.kind === 'outside') {
                last.span += 1;
            } else {
                const reason = date < employment.startsAt ? 'before' : 'after';
                result.push({ kind: 'outside', date, span: 1, reason });
            }
        }
        return result;
    };

    const cells: CalendarCell<R>[] = [];
    let cursor = 0;
    for (const request of [...requests].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
        const start = Math.max(indexOf(request.startsAt), cursor);
        const end = Math.min(indexOf(request.endsAt), days.length - 1);
        if (start > end) {
            continue;
        }
        cells.push(...freeDays(cursor, start));
        cells.push({ kind: 'request', request, date: days[start] ?? first, span: end - start + 1 });
        cursor = end + 1;
    }
    cells.push(...freeDays(cursor, days.length));
    return cells;
};
