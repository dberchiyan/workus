import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { formatAgo } from '@/shared/lib/formatAgo';

export interface SecurityTimeProps {
  /** The (oldest) instant. */
  from: string;
  /** The newest instant of a group, or null for one event. */
  to: string | null;
  /** `YYYY-MM-DD` of today, UTC. */
  today: string;
  now: number;
}

const FULL: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
};

/**
 * When it happened: "2 minutes ago" today, "5:06 PM" on an earlier day (the day heading says
 * which), "5:06–5:07 PM" for a group. The full date and time (UTC) on hover and for screen
 * readers.
 */
export function SecurityTime({ from, to, today, now }: SecurityTimeProps) {
  const { t, i18n } = useTranslation('auth');
  const locale = i18n.language;
  const time = new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'UTC' });
  const full = new Intl.DateTimeFormat(locale, FULL);
  const start = new Date(from);

  let shown: string;
  if (to !== null) {
    shown = time.formatRange(start, new Date(to));
  } else if (from.slice(0, 10) === today) {
    shown = formatAgo(from, now, locale) ?? t('securityLog.justNow');
  } else {
    shown = time.format(start);
  }
  const spoken = to === null ? full.format(start) : full.formatRange(start, new Date(to));

  return (
    <Tooltip title={spoken} describeChild>
      <time dateTime={to ?? from} className="whitespace-nowrap">
        <span aria-hidden>{shown}</span>
        <span className="sr-only">{spoken}</span>
      </time>
    </Tooltip>
  );
}
