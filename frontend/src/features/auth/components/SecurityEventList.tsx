import BlockOutlined from '@mui/icons-material/BlockOutlined';
import DevicesOtherOutlined from '@mui/icons-material/DevicesOtherOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import KeyOutlined from '@mui/icons-material/KeyOutlined';
import LockClockOutlined from '@mui/icons-material/LockClockOutlined';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import Pagination from '@mui/material/Pagination';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { SecurityEvent } from '../types';
import { describeUserAgent } from '../userAgent';

type Action = SecurityEvent['action'];

/** Icon and tone per action; the words always say what happened. */
const VISUALS: Record<Action, { icon: ComponentType<SvgIconProps>; warning: boolean }> = {
  'auth.signed_in': { icon: LoginOutlined, warning: false },
  'auth.sign_in_failed': { icon: ErrorOutlineOutlined, warning: true },
  'auth.sign_in_refused': { icon: BlockOutlined, warning: true },
  'auth.signed_out': { icon: LogoutOutlined, warning: false },
  'auth.password_changed': { icon: KeyOutlined, warning: false },
  'auth.session_ended': { icon: DevicesOtherOutlined, warning: false },
  'auth.other_sessions_ended': { icon: DevicesOtherOutlined, warning: false },
  'auth.session_evicted': { icon: DevicesOtherOutlined, warning: false },
  'auth.sessions_ended_on_termination': { icon: BlockOutlined, warning: true },
  'auth.sign_in_locked': { icon: LockClockOutlined, warning: true },
};

export interface SecurityEventListProps {
  events: readonly SecurityEvent[];
  total: number;
  /** Zero-based. */
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  /** An older page is on screen while the next one loads. */
  isStale: boolean;
}

/** A security log, newest first: what happened, on which device, from where, when (UTC). */
export function SecurityEventList({
  events,
  total,
  page,
  pageSize,
  onPage,
  isStale,
}: SecurityEventListProps) {
  const { t, i18n } = useTranslation('auth');
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
  const when = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(iso));

  if (total === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        {t('securityLog.empty')}
      </Typography>
    );
  }
  const from = page * pageSize + 1;
  const to = Math.min(total, from + pageSize - 1);

  return (
    <div className="flex flex-col gap-3">
      <ul
        aria-busy={isStale}
        className={cn('m-0 flex list-none flex-col p-0', isStale && 'opacity-60')}
      >
        {events.map((event) => {
          const { icon: Icon, warning } = VISUALS[event.action];
          const device = describeUserAgent(event.userAgent);
          const deviceName =
            device.browser && device.os
              ? t('securityLog.device', { browser: device.browser, os: device.os })
              : (device.browser ?? device.os ?? t('securityLog.unknownDevice'));
          return (
            <li
              key={event.id}
              className="flex items-center gap-3 border-b border-divider py-3 first:pt-0 last:border-b-0 last:pb-0"
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-md',
                  warning
                    ? 'bg-error-light/30 text-error'
                    : 'bg-badge-neutral-background text-text-secondary',
                )}
              >
                <Icon fontSize="small" />
              </span>
              <span className="flex min-w-0 flex-col">
                <Typography
                  variant="subtitle2"
                  component="span"
                  color={warning ? 'error' : 'textPrimary'}
                >
                  {t(`securityLog.actions.${event.action}`)}
                </Typography>
                <Typography variant="caption" color="textSecondary" className="app-tabular">
                  {[deviceName, event.ip, when(event.occurredAt)].filter(Boolean).join(' · ')}
                </Typography>
              </span>
            </li>
          );
        })}
      </ul>
      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-3">
          <Typography variant="caption" color="textSecondary" className="app-tabular">
            {t('securityLog.range', { from: number(from), to: number(to), count: number(total) })}
          </Typography>
          <Pagination
            shape="rounded"
            color="primary"
            count={pages}
            page={Math.min(page + 1, pages)}
            siblingCount={0}
            aria-label={t('securityLog.pages')}
            onChange={(_event, value) => {
              onPage(value - 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
