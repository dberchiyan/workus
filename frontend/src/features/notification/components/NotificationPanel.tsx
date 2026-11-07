import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarkAllRead, useMarkRead, useNotificationList } from '../hooks/useNotifications';
import { useNotificationView } from '../hooks/useNotificationView';
import type { AppNotification } from '../types';
import { NotificationItem } from './NotificationItem';

const SKELETON_ROWS = ['s1', 's2', 's3'];

export interface NotificationPanelProps {
  titleId: string;
  viewerId: string;
  unreadCount: number;
  onClose: () => void;
}

/** The bell's content: title, "Mark all as read", the list with its states, "Show more". */
export function NotificationPanel({
  titleId,
  viewerId,
  unreadCount,
  onClose,
}: NotificationPanelProps) {
  const { t } = useTranslation('notification');
  const list = useNotificationList(true);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const viewOf = useNotificationView();
  const items = list.data?.pages.flatMap((page) => page.content) ?? [];
  // The panel mounts on each opening, so "ago" is counted from then.
  const [now] = useState(() => Date.now());

  const open = (notification: AppNotification): void => {
    if (notification.readAt === null) {
      markRead.mutate(notification.id);
    }
    onClose();
  };

  return (
    <div className="flex max-h-[min(70vh,36rem)] flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-divider py-1 pr-2 pl-4">
        <Typography id={titleId} variant="subtitle1" component="h2">
          {t('panel.title')}
        </Typography>
        <Button
          size="small"
          disabled={unreadCount === 0 || markAllRead.isPending}
          onClick={() => {
            markAllRead.mutate();
          }}
        >
          {t('panel.markAllRead')}
        </Button>
      </div>
      {markAllRead.isError && (
        <Alert severity="error" className="m-2">
          {t('panel.markAllReadError')}
        </Alert>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {list.isPending ? (
          <ul aria-busy="true" className="m-0 list-none p-0">
            <li className="sr-only">{t('panel.loading')}</li>
            {SKELETON_ROWS.map((key) => (
              <li key={key} className="flex items-start gap-3 border-b border-divider px-4 py-3">
                <Skeleton variant="circular" className="size-8 shrink-0" />
                <span className="flex flex-1 flex-col">
                  <Skeleton variant="text" />
                  <Skeleton variant="text" className="w-1/2" />
                </span>
              </li>
            ))}
          </ul>
        ) : list.isError ? (
          <div className="p-4">
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => void list.refetch()}>
                  {t('panel.retry')}
                </Button>
              }
            >
              {t('panel.error')}
            </Alert>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <NotificationsNoneOutlined aria-hidden color="disabled" />
            <Typography variant="subtitle2" component="p">
              {t('panel.empty')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {t('panel.emptyHint')}
            </Typography>
          </div>
        ) : (
          <ul className="m-0 list-none p-0">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                view={viewOf(notification, viewerId)}
                now={now}
                onOpen={open}
              />
            ))}
          </ul>
        )}
      </div>

      {list.hasNextPage && (
        <div className="flex justify-center border-t border-divider p-1">
          <Button
            onClick={() => void list.fetchNextPage()}
            disabled={list.isFetchingNextPage}
            aria-busy={list.isFetchingNextPage}
          >
            {list.isFetchingNextPage ? t('panel.loadingMore') : t('panel.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}
