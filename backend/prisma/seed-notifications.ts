import type { PrismaClient } from '../src/generated/prisma/client';

const DAY_MS = 86_400_000;
/** Decisions this recent tell the employee; older notices than READ_AFTER_DAYS are read. */
const DECIDED_WITHIN_DAYS = 30;
const READ_AFTER_DAYS = 3;
const MAX_REQUESTS = 200;

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * The bell's history (dev only, once — skipped when any notification exists): what the app
 * would have sent for the seeded requests. Pending requests told their responsible people;
 * recent decisions told the employee.
 */
export const seedNotifications = async (
  prisma: PrismaClient,
  organisationId: string,
): Promise<number> => {
  if ((await prisma.notification.count({ where: { organisationId } })) > 0) {
    return 0;
  }
  const now = Date.now();
  const requests = await prisma.timeOffRequest.findMany({
    where: {
      organisationId,
      OR: [
        { status: 'PENDING' },
        {
          status: { in: ['APPROVED', 'REJECTED'] },
          decidedAt: { gte: new Date(now - DECIDED_WITHIN_DAYS * DAY_MS) },
        },
      ],
    },
    select: {
      id: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      decidedBy: true,
      decidedAt: true,
      employee: { select: { user: { select: { id: true, firstName: true, lastName: true } } } },
      responsibles: { select: { responsibleUserId: true }, take: 10 },
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_REQUESTS,
  });
  const readAt = (at: Date): Date | null =>
    now - at.getTime() > READ_AFTER_DAYS * DAY_MS ? new Date(at.getTime() + DAY_MS / 2) : null;
  const rows = requests.flatMap((request) => {
    const params = {
      requestType: request.type,
      startDate: isoDay(request.startDate),
      endDate: isoDay(request.endDate),
      employee: {
        userId: request.employee.user.id,
        firstName: request.employee.user.firstName,
        lastName: request.employee.user.lastName,
      },
    };
    const subject = {
      organisationId,
      subjectType: 'time_off_request',
      subjectId: request.id,
      params,
    };
    if (request.status === 'PENDING') {
      return request.responsibles.map(({ responsibleUserId }) => ({
        ...subject,
        recipientUserId: responsibleUserId,
        type: 'TIME_OFF_REQUESTED',
        actorUserId: request.employee.user.id,
        createdAt: request.createdAt,
        readAt: readAt(request.createdAt),
      }));
    }
    const decidedAt = request.decidedAt ?? request.createdAt;
    return [
      {
        ...subject,
        recipientUserId: request.employee.user.id,
        type: request.status === 'APPROVED' ? 'TIME_OFF_APPROVED' : 'TIME_OFF_REJECTED',
        actorUserId: request.decidedBy,
        createdAt: decidedAt,
        readAt: readAt(decidedAt),
      },
    ];
  });
  const { count } = await prisma.notification.createMany({ data: rows });
  return count;
};
