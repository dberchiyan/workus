import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { cn } from '@/shared/lib/cn';
import { formatAgo } from '../format';
import type { NotificationView } from '../hooks/useNotificationView';
import type { AppNotification } from '../types';

export interface NotificationItemProps {
  notification: AppNotification;
  view: NotificationView;
  now: number;
  /** Follows the link: marks it read and closes the panel. */
  onOpen: (notification: AppNotification) => void;
}

/** One row of the bell's list: who, what, the dates, how long ago; unread ones are marked. */
export function NotificationItem({ notification, view, now, onOpen }: NotificationItemProps) {
  const { t, i18n } = useTranslation('notification');
  const unread = notification.readAt === null;
  const ago = formatAgo(notification.createdAt, now, i18n.language) ?? t('panel.justNow');
  return (
    <li className="border-b border-divider last:border-b-0">
      <ButtonBase
        component={Link}
        to={view.href}
        onClick={() => {
          onOpen(notification);
        }}
        className={cn(
          'hover:bg-action-hover flex w-full items-start justify-start gap-3 px-4 py-3 text-left',
          unread && 'bg-primary/5',
        )}
      >
        {notification.actor ? (
          <InitialsAvatar
            id={notification.actor.id}
            firstName={notification.actor.firstName}
            lastName={notification.actor.lastName}
          />
        ) : (
          <span
            aria-hidden
            className="bg-warning/15 text-warning flex size-8 shrink-0 items-center justify-center rounded-full"
          >
            <AccessTimeOutlined fontSize="small" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Typography
            variant="body2"
            component="span"
            className={cn('[overflow-wrap:anywhere]', unread && 'font-medium')}
          >
            {unread && <span className="sr-only">{`${t('panel.unread')}: `}</span>}
            {view.message}
          </Typography>
          <Typography variant="caption" component="span" color="textSecondary">
            {`${view.period} · ${ago}`}
          </Typography>
        </span>
        {unread && <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
      </ButtonBase>
    </li>
  );
}
