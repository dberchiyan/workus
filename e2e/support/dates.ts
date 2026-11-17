const DAY_MS = 86_400_000;
const ISO_DAY_LENGTH = 10;
const SATURDAY = 6;
const SUNDAY = 0;

/** `YYYY-MM-DD` of a date in UTC — days are UTC across the product. */
export const isoDay = (date: Date): string => date.toISOString().slice(0, ISO_DAY_LENGTH);

export const todayIso = (): string => isoDay(new Date());

export const addDays = (day: string, days: number): string =>
    isoDay(new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS));

const isWeekend = (day: string): boolean => {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    return weekday === SATURDAY || weekday === SUNDAY;
};

/** The first weekday strictly after `day`. */
export const nextWeekday = (day: string): string => {
    let candidate = addDays(day, 1);
    while (isWeekend(candidate)) {
        candidate = addDays(candidate, 1);
    }
    return candidate;
};
