import type { NotificationRecord } from '../../repository/record/notification.record';
import { isNotificationType, TimeOffNoticeParamsSchema } from '../../service/notification-type';
import type { NotificationResponse } from '../dto/notification.response';

/** Rows of an unknown type or with params that no longer parse are left out, never guessed. */
export const toNotificationResponse = (
  notification: NotificationRecord,
): NotificationResponse | null => {
  const params = TimeOffNoticeParamsSchema.safeParse(notification.params);
  if (
    !params.success ||
    !isNotificationType(notification.type) ||
    notification.subjectType !== 'time_off_request'
  ) {
    return null;
  }
  return {
    id: notification.id,
    type: notification.type,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
    actor: notification.actor,
    subject: { type: notification.subjectType, id: notification.subjectId },
    request: {
      type: params.data.requestType,
      startDate: params.data.startDate,
      endDate: params.data.endDate,
      employee: params.data.employee,
      waitingDays: params.data.waitingDays ?? null,
    },
  };
};
