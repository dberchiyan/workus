import ComputerOutlined from '@mui/icons-material/ComputerOutlined';
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { describeUserAgent, type UserSession } from '@/features/auth';

const dateTime = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));

export interface SessionRowProps {
  session: UserSession;
  current: boolean;
  ending: boolean;
  onEnd?: () => void;
}

/** One session: device, IP and times; another one can be signed out. */
export function SessionRow({ session, current, ending, onEnd }: SessionRowProps) {
  const { t, i18n } = useTranslation('settings');
  const summary = describeUserAgent(session.userAgent);
  const name =
    summary.browser && summary.os
      ? t('sessions.device', { browser: summary.browser, os: summary.os })
      : (summary.browser ?? summary.os ?? t('sessions.unknownDevice'));
  const Icon =
    summary.mobile || session.clientType === 'MOBILE' ? PhoneIphoneOutlined : ComputerOutlined;

  return (
    <li className="flex flex-col gap-3 border-b border-divider py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-badge-neutral-background text-text-secondary"
        >
          <Icon fontSize="small" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-center gap-2">
            <Typography variant="subtitle2" component="span">
              {name}
            </Typography>
            {current && (
              <Chip
                size="small"
                label={t('sessions.current')}
                className="bg-badge-active-background text-badge-active-text"
              />
            )}
          </span>
          <Typography variant="caption" color="textSecondary" className="app-tabular">
            {[
              session.ip,
              t('sessions.signedIn', { date: dateTime(session.createdAt, i18n.language) }),
              t('sessions.lastActive', { date: dateTime(session.lastSeenAt, i18n.language) }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        </span>
      </span>
      {onEnd && (
        <Button
          size="small"
          loading={ending}
          aria-label={t('sessions.endOneLabel', { device: name })}
          onClick={onEnd}
          className="self-start sm:self-center"
        >
          {t('sessions.endOne')}
        </Button>
      )}
    </li>
  );
}
