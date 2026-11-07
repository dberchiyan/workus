import BlockOutlined from '@mui/icons-material/BlockOutlined';
import DevicesOtherOutlined from '@mui/icons-material/DevicesOtherOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import ExpandLessOutlined from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import KeyOutlined from '@mui/icons-material/KeyOutlined';
import LockClockOutlined from '@mui/icons-material/LockClockOutlined';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import Button from '@mui/material/Button';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import { type ComponentType, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { SECURITY_TONES, type SecurityEventGroup } from '../securityLog';
import type { SecurityEvent } from '../types';
import { describeUserAgent } from '../userAgent';
import { SecurityTime } from './SecurityTime';

type Action = SecurityEvent['action'];

const ICONS: Record<Action, ComponentType<SvgIconProps>> = {
  'auth.signed_in': LoginOutlined,
  'auth.sign_in_failed': ErrorOutlineOutlined,
  'auth.sign_in_refused': BlockOutlined,
  'auth.signed_out': LogoutOutlined,
  'auth.password_changed': KeyOutlined,
  'auth.session_ended': DevicesOtherOutlined,
  'auth.other_sessions_ended': DevicesOtherOutlined,
  'auth.session_evicted': DevicesOtherOutlined,
  'auth.sessions_ended_on_termination': BlockOutlined,
  'auth.sign_in_locked': LockClockOutlined,
};

/** Failed sign-ins in a row from this many on are called out. */
const REPEATED_FAILURES = 2;

export interface SecurityEventRowProps {
  group: SecurityEventGroup;
  /** `YYYY-MM-DD` of today (UTC) and the time the list was opened. */
  today: string;
  now: number;
}

/**
 * One row of the security log: an event, or several alike from one device folded together
 * ("Signed in / out ×4"), which opens to show each of them.
 */
export function SecurityEventRow({ group, today, now }: SecurityEventRowProps) {
  const { t } = useTranslation('auth');
  const [open, setOpen] = useState(false);
  const listId = useId();
  const { events } = group;
  // A group always has its first event; the type cannot tell.
  const newest = events[0] as SecurityEvent;
  const oldest = events[events.length - 1] as SecurityEvent;
  const count = events.length;
  const tone = SECURITY_TONES[newest.action];
  const Icon = ICONS[newest.action];
  const actions = new Set(events.map((event) => event.action));
  const title =
    count === 1
      ? t(`securityLog.actions.${newest.action}`)
      : actions.size > 1
        ? t('securityLog.group.signedInOut', { count })
        : t('securityLog.group.repeated', {
            action: t(`securityLog.short.${newest.action}`),
            count,
          });
  const newDevice = events.some((event) => event.newDevice);
  const repeatedFailures = newest.action === 'auth.sign_in_failed' && count >= REPEATED_FAILURES;

  const device = describeUserAgent(newest.userAgent);
  const deviceName =
    device.browser && device.os
      ? t('securityLog.device', { browser: device.browser, os: device.os })
      : (device.browser ?? device.os ?? t('securityLog.unknownDevice'));

  return (
    <li
      className={cn(
        'flex flex-col gap-2 rounded-md px-3 py-3',
        tone === 'critical' && 'bg-badge-active-background',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md',
            tone === 'danger' && 'bg-error-light/30 text-error',
            tone === 'critical' && 'bg-background-paper text-primary',
            tone === 'normal' && 'bg-badge-neutral-background text-text-secondary',
          )}
        >
          <Icon fontSize="small" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Typography
              variant="subtitle2"
              component="span"
              color={tone === 'danger' ? 'error' : 'textPrimary'}
            >
              {title}
            </Typography>
            {newDevice && (
              <Typography
                variant="caption"
                component="span"
                className="rounded-full bg-badge-active-background px-2 text-badge-active-text"
              >
                {t('securityLog.newDevice')}
              </Typography>
            )}
          </div>
          <Typography variant="caption" color="textSecondary" className="app-tabular">
            {[deviceName, newest.ip].filter(Boolean).join(' · ')}
            {' · '}
            <SecurityTime
              from={oldest.occurredAt}
              to={count > 1 ? newest.occurredAt : null}
              today={today}
              now={now}
            />
          </Typography>
          {repeatedFailures && (
            // The theme has no warning colour with text contrast; error red carries it.
            <Typography variant="caption" color="error" className="mt-0.5 flex items-center gap-1">
              <WarningAmberOutlined aria-hidden fontSize="inherit" />
              {t('securityLog.repeatedFailures', { count })}
            </Typography>
          )}
        </div>
        {count > 1 && (
          <Button
            size="small"
            color="inherit"
            aria-expanded={open}
            aria-controls={listId}
            endIcon={open ? <ExpandLessOutlined aria-hidden /> : <ExpandMoreOutlined aria-hidden />}
            onClick={() => {
              setOpen(!open);
            }}
            className="shrink-0"
          >
            {open ? t('securityLog.hide') : t('securityLog.show')}
          </Button>
        )}
      </div>
      {count > 1 && (
        <ul
          id={listId}
          // A class, not the hidden attribute: `flex` would override the attribute.
          className={cn('m-0 ml-12 list-none flex-col gap-1 p-0', open ? 'flex' : 'hidden')}
        >
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap gap-x-2">
              <Typography variant="caption">{t(`securityLog.short.${event.action}`)}</Typography>
              <Typography variant="caption" color="textSecondary" className="app-tabular">
                <SecurityTime from={event.occurredAt} to={null} today={today} now={now} />
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
