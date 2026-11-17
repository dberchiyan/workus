import { isoDay } from '../../../../common/time/iso-day';
const DAY_MS = 86_400_000;

/** Today as a UTC calendar date (midnight UTC), matching `@db.Date` values. */
export const todayUtc = (): Date => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

export const minusDays = (date: Date, days: number): Date => new Date(date.getTime() - days * DAY_MS);

export const toIsoDate = isoDay;
