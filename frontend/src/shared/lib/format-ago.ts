import { DAY_MS, HOUR_MS, MINUTE_MS, WEEK_MS } from '@/shared/lib/units';

/**
 * "5 minutes ago", "yesterday", "3 days ago"; a date (UTC, as every time in the app) after a
 * week. Null under a minute — the caller says "just now".
 */
export const formatAgo = (iso: string, now: number, locale: string): string | null => {
    const elapsed = Math.max(0, now - new Date(iso).getTime());
    if (elapsed < MINUTE_MS) {
        return null;
    }
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (elapsed < HOUR_MS) {
        return relative.format(-Math.floor(elapsed / MINUTE_MS), 'minute');
    }
    if (elapsed < DAY_MS) {
        return relative.format(-Math.floor(elapsed / HOUR_MS), 'hour');
    }
    if (elapsed < WEEK_MS) {
        return relative.format(-Math.floor(elapsed / DAY_MS), 'day');
    }
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));
};
