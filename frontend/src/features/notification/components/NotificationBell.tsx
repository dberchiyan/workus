import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { useUnreadCount } from '../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

/** The bell in the top bar: the unread count (polled), and the list in a popover. */
export function NotificationBell() {
  const { t } = useTranslation('notification');
  const { data: user } = useCurrentUser();
  const unread = useUnreadCount();
  const panelId = useId();
  const titleId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const count = unread.data ?? 0;

  if (!user) {
    return null;
  }
  const close = (): void => {
    setAnchor(null);
  };

  return (
    <>
      <IconButton
        aria-label={count > 0 ? t('bell.labelUnread', { count }) : t('bell.label')}
        aria-haspopup="dialog"
        aria-controls={anchor ? panelId : undefined}
        aria-expanded={anchor ? true : undefined}
        onClick={(event) => {
          setAnchor(event.currentTarget);
        }}
      >
        <Badge badgeContent={count} max={99} color="error">
          <NotificationsOutlined aria-hidden />
        </Badge>
      </IconButton>
      <Popover
        id={panelId}
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-labelledby': titleId,
            // A phone gets the width less a 16 px edge on each side.
            className: 'w-[calc(100vw-2rem)] max-w-[26rem]',
          },
        }}
      >
        <NotificationPanel
          titleId={titleId}
          viewerId={user.id}
          unreadCount={count}
          onClose={close}
        />
      </Popover>
    </>
  );
}
