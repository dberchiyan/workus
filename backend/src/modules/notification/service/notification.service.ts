import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../../../common/exception/api.exception';
import type { Pageable } from '../../../common/dto/pageable';
import type { NotificationRecord } from '../repository/record/notification.record';
import { NotificationRepository } from '../repository/notification.repository';
import type { NotificationSortField } from './notification-sort';
import {
  type NotificationSubjectType,
  type NotificationType,
  type TimeOffNoticeParams,
  TimeOffNoticeParamsSchema,
} from './notification-type';

/** One event to tell several people about. */
export interface Notice {
  /** The subject's organisation — every recipient belongs to it. */
  organisationId: string;
  type: NotificationType;
  /** Null = the system. Never notified of their own action. */
  actorUserId: string | null;
  recipientUserIds: readonly string[];
  subject: { type: NotificationSubjectType; id: string };
  params: TimeOffNoticeParams;
}

const DAY_MS = 86_400_000;
/** Notifications are a feed, not a record: older ones are deleted. */
const RETENTION_DAYS = 90;

/**
 * The bell: other modules send notices inside their own transaction (written with the change);
 * each person reads and marks their own.
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    @InjectPinoLogger(NotificationService.name) private readonly logger: PinoLogger,
  ) {}

  /** Writes one row per recipient (the actor and repeats left out), all in one statement. */
  async send(notices: readonly Notice[]): Promise<void> {
    await this.notificationRepository.createMany(
      notices.flatMap((notice) => {
        const params = TimeOffNoticeParamsSchema.parse(notice.params);
        return [...new Set(notice.recipientUserIds)]
          .filter((recipientUserId) => recipientUserId !== notice.actorUserId)
          .map((recipientUserId) => ({
            organisationId: notice.organisationId,
            recipientUserId,
            type: notice.type,
            actorUserId: notice.actorUserId,
            subjectType: notice.subject.type,
            subjectId: notice.subject.id,
            params,
          }));
      }),
    );
  }

  /**
   * Like `send`, but skips a recipient who already got a notice of the same type about the
   * same subject since the instant (reminders repeat at most that often).
   */
  async sendUnlessSentSince(notices: readonly Notice[], since: Date): Promise<number> {
    const type = notices[0]?.type;
    if (!type) {
      return 0;
    }
    const sent = await this.notificationRepository.findSentSince(
      type,
      notices.map((notice) => notice.subject.id),
      since,
    );
    const already = new Set(sent.map((row) => `${row.recipientUserId}:${row.subjectId}`));
    const due = notices
      .map((notice) => ({
        ...notice,
        recipientUserIds: notice.recipientUserIds.filter(
          (id) => !already.has(`${id}:${notice.subject.id}`),
        ),
      }))
      .filter((notice) => notice.recipientUserIds.length > 0);
    await this.send(due);
    return due.reduce((sum, notice) => sum + notice.recipientUserIds.length, 0);
  }

  findPage(
    organisationId: string,
    userId: string,
    pageable: Pageable<NotificationSortField>,
  ): Promise<{ content: NotificationRecord[]; totalElements: number }> {
    return this.notificationRepository.findPageByRecipient(organisationId, userId, pageable);
  }

  countUnread(organisationId: string, userId: string): Promise<number> {
    return this.notificationRepository.countUnread(organisationId, userId);
  }

  /** The policy has checked it is the caller's; reading it again changes nothing. */
  async markRead(
    organisationId: string,
    userId: string,
    notificationId: string,
  ): Promise<NotificationRecord> {
    const notification = await this.notificationRepository.markRead(
      organisationId,
      notificationId,
      userId,
      new Date(),
    );
    if (!notification) {
      throw new ResourceNotFoundException();
    }
    return notification;
  }

  markAllRead(organisationId: string, userId: string): Promise<number> {
    return this.notificationRepository.markAllRead(organisationId, userId, new Date());
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'UTC' })
  async deleteOld(): Promise<void> {
    const count = await this.notificationRepository.deleteCreatedBefore(
      new Date(Date.now() - RETENTION_DAYS * DAY_MS),
    );
    this.logger.info({ count }, 'Old notifications deleted');
  }
}
