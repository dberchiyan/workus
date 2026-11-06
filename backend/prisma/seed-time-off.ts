import type { Prisma, PrismaClient } from '../src/generated/prisma/client';
import { AuditAction, AuditTargetType } from '../src/modules/audit/service/audit-action';
import {
  type AuditChange,
  AuditField,
  auditValue,
} from '../src/modules/audit/service/audit-change';
import {
  cycleOf,
  LEAVE_POLICY,
  plusDays,
  todayUtc,
  workingDaysBetween,
} from '../src/modules/time-off/service/leave-policy';
import { type TimeOffStatus, TimeOffType } from '../src/modules/time-off/service/time-off-type';
import { timeOffLabel } from '../src/modules/time-off/service/time-off-label';

const HOUR_MS = 3_600_000;

/** The Monday on or after `date`. */
const weekday = (date: Date): Date => {
  const day = date.getUTCDay();
  return day === 6 ? plusDays(date, 2) : day === 0 ? plusDays(date, 1) : date;
};

/** The day on which `count` working days starting at `start` (a weekday) are covered. */
const plusWorkingDays = (start: Date, count: number): Date => {
  let end = start;
  while (workingDaysBetween(start, end) < count) {
    end = plusDays(end, 1);
  }
  return end;
};

interface Plan {
  type: TimeOffType;
  /** Days from the cycle start (or from today with `fromToday`). */
  offset: number;
  length: number;
  status: TimeOffStatus;
  fromToday?: true;
  note?: string;
  decisionComment?: string;
}

/**
 * Per employee: the previous vacation cycle has an approved vacation; the current one an approved
 * vacation (when it has already started), a rejected and a canceled one and a pending request
 * ahead; an approved sick day and day off this year. Vacation days stay within the allowance.
 */
const plansFor = (index: number): Plan[] => [
  // Every fifth person is off around today (the admin dashboard's "Out today").
  ...(index % 5 === 2
    ? [
        {
          type: TimeOffType.VACATION,
          offset: -1,
          length: 3,
          status: 'APPROVED',
          fromToday: true,
        } satisfies Plan,
      ]
    : []),
  { type: TimeOffType.VACATION, offset: -150 + (index % 20), length: 5, status: 'APPROVED' },
  { type: TimeOffType.VACATION, offset: 20 + (index % 15), length: 3, status: 'APPROVED' },
  {
    type: TimeOffType.VACATION,
    offset: 50 + (index % 10),
    length: 2,
    status: 'REJECTED',
    note: 'Family trip',
    decisionComment: 'Release week — please pick other dates',
  },
  { type: TimeOffType.DAY_OFF, offset: 70 + (index % 12), length: 1, status: 'CANCELED' },
  {
    type: TimeOffType.SICK_DAY,
    offset: -40 - (index % 30),
    length: 1 + (index % 2),
    status: 'APPROVED',
    fromToday: true,
  },
  {
    type: TimeOffType.DAY_OFF,
    offset: -20 - (index % 9),
    length: 1,
    status: 'APPROVED',
    fromToday: true,
    note: 'Moving house',
  },
  {
    type: TimeOffType.VACATION,
    offset: 14 + (index % 21),
    length: 4,
    status: 'PENDING',
    fromToday: true,
    note: 'Summer break',
  },
];

/**
 * Time-off requests with their history for seeded employees (dev only). Skips employees that
 * already have requests. Decisions are made by the employee's first responsible person.
 */
export const seedTimeOff = async (
  prisma: PrismaClient,
  fallbackResponsibleId: string,
): Promise<number> => {
  const today = todayUtc();
  const now = new Date();
  const employees = await prisma.employee.findMany({
    where: { timeOffRequests: { none: {} } },
    select: {
      id: true,
      userId: true,
      startDate: true,
      terminatedOn: true,
      responsibles: { select: { responsibleUserId: true }, take: 10 },
    },
    orderBy: { startDate: 'asc' },
  });
  let created = 0;
  for (const [index, employee] of employees.entries()) {
    const responsibleUserIds =
      employee.responsibles.length > 0
        ? employee.responsibles.map((r) => r.responsibleUserId)
        : [fallbackResponsibleId];
    const decider = responsibleUserIds[0] ?? fallbackResponsibleId;
    const vacationCycle = cycleOf(employee.startDate, LEAVE_POLICY.VACATION.cycleMonths, today);
    const lastDay = employee.terminatedOn ? plusDays(employee.terminatedOn, -1) : null;
    const taken: { start: Date; end: Date }[] = [];
    const events: Prisma.AuditEventCreateManyInput[] = [];

    for (const plan of plansFor(index)) {
      const base = plan.fromToday ? today : vacationCycle.start;
      const start = weekday(plusDays(base, plan.offset));
      const end = plusWorkingDays(start, plan.length);
      const days = workingDaysBetween(start, end);
      const outsideEmployment = start < employee.startDate || (lastDay !== null && end > lastDay);
      const overlaps = taken.some((t) => start <= t.end && end >= t.start);
      // Terminated people have nothing pending.
      if (outsideEmployment || overlaps || (plan.status === 'PENDING' && lastDay !== null)) {
        continue;
      }
      taken.push({ start, end });
      // Made two weeks ahead (sick days on the day), never in the future.
      const createdAt = new Date(
        Math.min(
          (plan.type === TimeOffType.SICK_DAY ? start : plusDays(start, -14)).getTime() +
            9 * HOUR_MS,
          now.getTime() - 6 * HOUR_MS,
        ),
      );
      const decidedAt =
        plan.status === 'APPROVED' || plan.status === 'REJECTED'
          ? new Date(Math.min(createdAt.getTime() + 26 * HOUR_MS, now.getTime() - 3 * HOUR_MS))
          : null;
      const canceledAt =
        plan.status === 'CANCELED'
          ? new Date(Math.min(createdAt.getTime() + 5 * HOUR_MS, now.getTime() - 2 * HOUR_MS))
          : null;
      const request = await prisma.timeOffRequest.create({
        data: {
          employeeId: employee.id,
          type: plan.type,
          startDate: start,
          endDate: end,
          days,
          status: plan.status,
          note: plan.note ?? null,
          decisionComment: plan.decisionComment ?? null,
          decidedBy: decidedAt ? decider : null,
          decidedAt,
          createdAt,
          createdBy: employee.userId,
          updatedBy: decidedAt ? decider : employee.userId,
          // The last change, not the seed run (the dashboard shows what changed today).
          updatedAt: canceledAt ?? decidedAt ?? createdAt,
          responsibles: {
            create: responsibleUserIds.map((responsibleUserId) => ({ responsibleUserId })),
          },
        },
        select: { id: true },
      });
      created += 1;
      const target = {
        targetType: AuditTargetType.TIME_OFF_REQUEST,
        targetId: request.id,
        targetLabel: timeOffLabel({ type: plan.type, startDate: start, endDate: end }),
        employeeId: employee.id,
        ipAddress: '127.0.0.1',
        userAgent: 'seed',
      };
      const createdChanges: AuditChange[] = [
        { field: AuditField.TIME_OFF_TYPE, from: null, to: auditValue.timeOffType(plan.type) },
        { field: AuditField.PERIOD_START, from: null, to: auditValue.date(start) },
        { field: AuditField.PERIOD_END, from: null, to: auditValue.date(end) },
        { field: AuditField.DAYS, from: null, to: auditValue.number(days) },
        ...(plan.note
          ? [{ field: AuditField.NOTE, from: null, to: auditValue.text(plan.note) }]
          : []),
      ];
      events.push({
        ...target,
        occurredAt: createdAt,
        action: AuditAction.TIME_OFF_REQUEST_CREATED,
        actorUserId: employee.userId,
        changes: createdChanges,
      });
      const status = (to: TimeOffStatus): AuditChange => ({
        field: AuditField.STATUS,
        from: auditValue.timeOffStatus('PENDING'),
        to: auditValue.timeOffStatus(to),
      });
      if (decidedAt) {
        events.push({
          ...target,
          occurredAt: decidedAt,
          action:
            plan.status === 'APPROVED'
              ? AuditAction.TIME_OFF_REQUEST_APPROVED
              : AuditAction.TIME_OFF_REQUEST_REJECTED,
          actorUserId: decider,
          changes: [
            status(plan.status),
            ...(plan.decisionComment
              ? [
                  {
                    field: AuditField.DECISION_COMMENT,
                    from: null,
                    to: auditValue.text(plan.decisionComment),
                  },
                ]
              : []),
          ],
        });
      } else if (plan.status === 'CANCELED') {
        events.push({
          ...target,
          occurredAt: canceledAt ?? createdAt,
          action: AuditAction.TIME_OFF_REQUEST_CANCELED,
          actorUserId: employee.userId,
          changes: [status('CANCELED')],
        });
      }
    }
    await prisma.auditEvent.createMany({ data: events });
  }
  return created;
};
