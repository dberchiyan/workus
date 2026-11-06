const DAY_MS = 86_400_000;

/** Today as a UTC calendar date (midnight UTC), matching `@db.Date` values. */
export const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

export const minusDays = (date: Date, days: number): Date =>
  new Date(date.getTime() - days * DAY_MS);

/** `YYYY-MM-DD` for a `@db.Date` value. */
export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);
