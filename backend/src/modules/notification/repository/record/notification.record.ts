import type { Prisma } from '../../../../generated/prisma/client';

export const notificationSelect = {
  id: true,
  type: true,
  subjectType: true,
  subjectId: true,
  params: true,
  createdAt: true,
  readAt: true,
  actor: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.NotificationSelect;
export type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;
