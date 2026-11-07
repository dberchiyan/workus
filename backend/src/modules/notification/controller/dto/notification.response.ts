import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { pageResponseSchema } from '../../../../common/dto/page.response';
import { NOTIFICATION_TYPES } from '../../service/notification-type';

export const NotificationSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(NOTIFICATION_TYPES),
    createdAt: z.iso.datetime(),
    /** Null = not read yet. */
    readAt: z.iso.datetime().nullable(),
    /** Who caused it; null = the system (reminders). */
    actor: z
      .object({ id: z.uuid(), firstName: z.string().max(100), lastName: z.string().max(100) })
      .nullable(),
    /** What it is about — the client links to it. */
    subject: z.object({ type: z.enum(['time_off_request']), id: z.uuid() }),
    /** The time-off request as it was when the notice was sent. */
    request: z.object({
      type: z.string().max(16),
      startDate: z.iso.date(),
      endDate: z.iso.date(),
      employee: z.object({
        userId: z.uuid(),
        firstName: z.string().max(100),
        lastName: z.string().max(100),
      }),
      /** Reminders only: whole days it has waited. */
      waitingDays: z.number().int().min(0).nullable(),
    }),
  })
  .meta({ id: 'Notification' });

export class NotificationResponse extends createZodDto(z.object(NotificationSchema.shape)) {}
export class NotificationPageResponse extends createZodDto(
  pageResponseSchema(NotificationSchema),
) {}

export class UnreadNotificationsResponse extends createZodDto(
  z.object({ count: z.number().int().min(0) }),
) {}
