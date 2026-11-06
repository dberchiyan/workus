import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { cn } from '@/shared/lib/cn';
import { formatDateTime, formatTime } from '../activityFormat';
import type { ActivityAction, ActivityEvent } from '../types';
import { ActivityChangeRow } from './ActivityChangeRow';

/** More than this many changes → the rest behind "Show all". */
const COLLAPSED_CHANGES = 5;

const ACTION_STYLE = {
  'employee.created': {
    headline: 'profile.activity.headline.employeeCreated',
    icon: PersonAddAlt1Outlined,
    tone: 'bg-success-light text-success-dark dark:text-success',
  },
  'review.created': {
    headline: 'profile.activity.headline.reviewCreated',
    icon: AddOutlined,
    tone: 'bg-success-light text-success-dark dark:text-success',
  },
  'review.updated': {
    headline: 'profile.activity.headline.reviewUpdated',
    icon: EditOutlined,
    tone: 'bg-badge-active-background text-badge-active-text',
  },
  'review.deleted': {
    headline: 'profile.activity.headline.reviewDeleted',
    icon: DeleteOutlineOutlined,
    tone: 'bg-badge-neutral-background text-error',
  },
} as const satisfies Record<ActivityAction, unknown>;

export interface ActivityEventItemProps {
  event: ActivityEvent;
  /** The rail line continues below every item except the very last one. */
  isLast: boolean;
}

/** A timeline entry: kind icon on the rail, then a card — who, what, when, before → after. */
export function ActivityEventItem({ event, isLast }: ActivityEventItemProps) {
  const { t, i18n } = useTranslation('employee');
  const [isExpanded, setIsExpanded] = useState(false);
  const changesId = useId();
  const style = ACTION_STYLE[event.action];
  const Icon = style.icon;
  const occurredAt = new Date(event.occurredAt);
  const actorName = event.actor
    ? `${event.actor.firstName} ${event.actor.lastName}`
    : t('profile.activity.system');
  const isCollapsible = event.changes.length > COLLAPSED_CHANGES + 1;
  const visible =
    isCollapsible && !isExpanded ? event.changes.slice(0, COLLAPSED_CHANGES) : event.changes;

  return (
    <li className="flex gap-3 sm:gap-4">
      <div aria-hidden className="flex flex-col items-center">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            style.tone,
          )}
        >
          <Icon fontSize="small" />
        </span>
        {!isLast && <span className="w-px flex-1 bg-divider" />}
      </div>
      <Card variant="outlined" component="article" className="mb-4 min-w-0 flex-1 p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {event.actor ? (
            <InitialsAvatar
              id={event.actor.id}
              firstName={event.actor.firstName}
              lastName={event.actor.lastName}
              size="sm"
              className="mt-0.5 shrink-0"
            />
          ) : (
            <Avatar className="mt-0.5 size-7 shrink-0 bg-badge-neutral-background text-badge-neutral-text">
              <SettingsOutlined aria-hidden fontSize="inherit" />
            </Avatar>
          )}
          <Typography
            variant="body2"
            component="p"
            className="m-0 min-w-0 flex-1 [overflow-wrap:anywhere]"
          >
            <Trans
              t={t}
              i18nKey={style.headline}
              values={{ actor: actorName, target: event.target.label }}
              components={{
                actor: <Typography variant="subtitle2" component="span" />,
                target: <Typography variant="subtitle2" component="span" />,
              }}
            />
          </Typography>
          <Tooltip title={formatDateTime(occurredAt, i18n.language)}>
            <Typography
              variant="caption"
              component="time"
              color="textSecondary"
              dateTime={event.occurredAt}
              className="app-tabular mt-0.5 shrink-0"
            >
              {formatTime(occurredAt, i18n.language)}
            </Typography>
          </Tooltip>
        </div>
        {event.changes.length > 0 && (
          // Indented under the headline text, past the avatar (size-7 + gap-3 = 2.5rem).
          <div className="mt-2 sm:pl-10">
            <dl id={changesId} className="m-0 flex flex-col divide-y divide-divider">
              {visible.map((change) => (
                <ActivityChangeRow key={change.field} change={change} />
              ))}
            </dl>
            {isCollapsible && (
              <Button
                size="small"
                aria-expanded={isExpanded}
                aria-controls={changesId}
                onClick={() => {
                  setIsExpanded((value) => !value);
                }}
                className="mt-1 -ml-2"
              >
                {isExpanded
                  ? t('profile.activity.showFewer')
                  : t('profile.activity.showAll', { count: event.changes.length })}
              </Button>
            )}
          </div>
        )}
      </Card>
    </li>
  );
}
