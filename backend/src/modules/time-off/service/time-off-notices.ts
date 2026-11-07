import type { Notice } from '../../notification/service/notification.service';
import {
  NotificationSubjectType,
  type NotificationType,
} from '../../notification/service/notification-type';
import type { RequestNoticeRecord } from '../repository/record/time-off-request.record';

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

export const employeeUserIdOf = (request: RequestNoticeRecord): string => request.employee.user.id;

export const responsibleUserIdsOf = (request: RequestNoticeRecord): string[] =>
  request.responsibles.map(({ responsibleUserId }) => responsibleUserId);

/** A notice about this request (the notification service leaves the actor out of recipients). */
export const requestNotice = (
  request: RequestNoticeRecord,
  type: NotificationType,
  actorUserId: string | null,
  recipientUserIds: readonly string[],
  waitingDays?: number,
): Notice => ({
  organisationId: request.organisationId,
  type,
  actorUserId,
  recipientUserIds,
  subject: { type: NotificationSubjectType.TIME_OFF_REQUEST, id: request.id },
  params: {
    requestType: request.type,
    startDate: isoDay(request.startDate),
    endDate: isoDay(request.endDate),
    employee: {
      userId: request.employee.user.id,
      firstName: request.employee.user.firstName,
      lastName: request.employee.user.lastName,
    },
    ...(waitingDays === undefined ? {} : { waitingDays }),
  },
});
