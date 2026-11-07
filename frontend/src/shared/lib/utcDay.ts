/**
 * The company counts days in UTC everywhere (product decision): "today", cycles, the calendar,
 * dashboards and insights. Instants are shown in UTC too, so a time never lands on another day.
 */
/** UTC calendar day of an instant, `YYYY-MM-DD`. */
export const utcDayOf = (instant: Date): string => instant.toISOString().slice(0, 10);

/** Today (UTC), `YYYY-MM-DD`. */
export const todayUtcIso = (): string => utcDayOf(new Date());

/** This month (UTC), `YYYY-MM`. */
export const currentMonthUtc = (): string => todayUtcIso().slice(0, 7);

/** This year and month (UTC). */
export const nowUtc = (): { year: number; month: number } => {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
};

/** Today (UTC) as the instants it starts and ends: `[from, to)`. */
export const todayUtcRange = (): { date: string; from: string; to: string } => {
  const date = todayUtcIso();
  const from = new Date(`${date}T00:00:00Z`);
  return {
    date,
    from: from.toISOString(),
    to: new Date(from.getTime() + 86_400_000).toISOString(),
  };
};

/** The day before a `YYYY-MM-DD` day. */
export const previousDay = (day: string): string =>
  utcDayOf(new Date(new Date(`${day}T00:00:00Z`).getTime() - 86_400_000));
