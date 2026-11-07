import { useTranslation } from 'react-i18next';
import { formatTimeOffPeriod, isTimeOffType } from '@/features/time-off';
import { PATHS, requestPath } from '@/shared/lib/paths';
import type { AppNotification } from '../types';

export interface NotificationView {
  /** One sentence: who did what. */
  message: string;
  /** The request's dates. */
  period: string;
  /** Where it leads: one's own request on the dashboard, anyone else's on Requests. */
  href: string;
}

const fullName = (person: { firstName: string; lastName: string }): string =>
  `${person.firstName} ${person.lastName}`;

/** The texts and link of one notification, as the viewer reads it. */
export const useNotificationView = () => {
  const { t, i18n } = useTranslation('notification');
  return (notification: AppNotification, viewerId: string): NotificationView => {
    const { request } = notification;
    const own = request.employee.userId === viewerId;
    const typeKey = isTimeOffType(request.type) ? request.type : 'OTHER';
    const values = {
      actor: notification.actor ? fullName(notification.actor) : t('someone'),
      employee: fullName(request.employee),
      type: t(`type.${typeKey}.plain`),
      typeWithArticle: t(`type.${typeKey}.withArticle`),
    };
    const message =
      notification.type === 'TIME_OFF_REMINDER'
        ? t('message.TIME_OFF_REMINDER', { ...values, count: request.waitingDays ?? 0 })
        : notification.type === 'TIME_OFF_COMMENTED' && own
          ? t('message.TIME_OFF_COMMENTED_own', values)
          : t(`message.${notification.type}`, values);
    return {
      message,
      period: formatTimeOffPeriod(request.startDate, request.endDate, i18n.language),
      href: own
        ? `${PATHS.dashboard}?request=${encodeURIComponent(notification.subject.id)}`
        : requestPath(notification.subject.id),
    };
  };
};
