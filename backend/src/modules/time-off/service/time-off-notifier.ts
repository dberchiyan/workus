import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationType } from '../../notification/service/notification-type';
import { NotificationService } from '../../notification/service/notification.service';
import { TimeOffRequestRepository } from '../repository/time-off-request.repository';
import { employeeUserIdOf, requestNotice, responsibleUserIdsOf } from './time-off-notices';

const DAY_MS = 86_400_000;
/** A pending request older than this reminds its responsible people, at most this often. */
export const REMINDER_AFTER_DAYS = 3;
/** Requests reminded about in one run (the oldest first). */
const MAX_REMINDERS_PER_RUN = 500;

/** Who hears about a request: its employee, its responsible people, or both. */
export type NoticeAudience = 'employee' | 'responsibles' | 'everyone' | readonly string[];

/**
 * Tells people about changes to time-off requests through the bell. Called inside the
 * transaction that makes the change, so a notice is never sent for a change that rolled back.
 */
@Injectable()
export class TimeOffNotifier {
  constructor(
    private readonly requestRepository: TimeOffRequestRepository,
    private readonly notificationService: NotificationService,
    @InjectPinoLogger(TimeOffNotifier.name) private readonly logger: PinoLogger,
  ) {}

  async notify(
    organisationId: string,
    requestId: string,
    type: NotificationType,
    actorUserId: string,
    audience: NoticeAudience,
  ): Promise<void> {
    const request = await this.requestRepository.findNoticeById(organisationId, requestId);
    if (!request) {
      return;
    }
    const recipients =
      audience === 'employee'
        ? [employeeUserIdOf(request)]
        : audience === 'responsibles'
          ? responsibleUserIdsOf(request)
          : audience === 'everyone'
            ? [employeeUserIdOf(request), ...responsibleUserIdsOf(request)]
            : audience;
    await this.notificationService.send([requestNotice(request, type, actorUserId, recipients)]);
  }

  /**
   * Every morning (UTC): pending requests waiting longer than REMINDER_AFTER_DAYS remind their
   * responsible people — again every REMINDER_AFTER_DAYS days while still pending.
   */
  @Cron('0 8 * * *', { timeZone: 'UTC' })
  async remindPending(): Promise<void> {
    const now = Date.now();
    const since = new Date(now - REMINDER_AFTER_DAYS * DAY_MS);
    const requests = await this.requestRepository.findPendingCreatedBefore(
      since,
      MAX_REMINDERS_PER_RUN,
    );
    const count = await this.notificationService.sendUnlessSentSince(
      requests.map((request) =>
        requestNotice(
          request,
          NotificationType.TIME_OFF_REMINDER,
          null,
          responsibleUserIdsOf(request),
          Math.floor((now - request.createdAt.getTime()) / DAY_MS),
        ),
      ),
      since,
    );
    this.logger.info({ count }, 'Pending time-off reminders sent');
  }
}
