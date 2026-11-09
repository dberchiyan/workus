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
import {
  isTimeOffType,
  TIME_OFF_TYPES,
  type TimeOffStatus,
  TimeOffType,
} from '../src/modules/time-off/service/time-off-type';
import { timeOffLabel } from '../src/modules/time-off/service/time-off-label';

const HOUR_MS = 3_600_000;

/**
 * Pending requests in the seed, by type (4 in all): sick days and vacations made this morning and
 * starting today — the demo resets daily, so "today" always has fresh requests to decide.
 */
const PENDING_MIX: Readonly<Record<TimeOffType, number>> = {
  [TimeOffType.VACATION]: 2,
  [TimeOffType.DAY_OFF]: 0,
  [TimeOffType.SICK_DAY]: 2,
};

/** People with a rejected vacation in their history (the rest is approved). */
const REJECTED_AT = new Set([3, 10]);

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
 * vacation (when it has already started); an approved sick day and day off this year. A couple of
 * people also have a rejected vacation. Pending requests come from `seedPendingRequests`.
 * Vacation days stay within the allowance.
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
  ...(REJECTED_AT.has(index)
    ? [
        {
          type: TimeOffType.VACATION,
          offset: 50 + (index % 10),
          length: 2,
          status: 'REJECTED',
          note: 'Family trip',
          decisionComment: 'Release week — please pick other dates',
        } satisfies Plan,
      ]
    : []),
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
];

/**
 * Time-off requests with their history for seeded employees (dev only). Skips employees that
 * already have requests. Decisions are made by the employee's first responsible person.
 */
export const seedTimeOff = async (
  prisma: PrismaClient,
  organisationId: string,
  fallbackResponsibleId: string,
): Promise<number> => {
  const today = todayUtc();
  const now = new Date();
  const employees = await prisma.employee.findMany({
    where: { organisationId, timeOffRequests: { none: {} } },
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
      if (outsideEmployment || overlaps) {
        continue;
      }
      taken.push({ start, end });
      // Made two weeks ahead (sick days on the day), never in the future — and never all on the
      // seed day: a request planned ahead was made 1–20 days ago, so "made today" stays short.
      const daysAgo = 1 + ((index * 7 + taken.length * 3) % 20);
      const createdAt = new Date(
        Math.min(
          (plan.type === TimeOffType.SICK_DAY ? start : plusDays(start, -14)).getTime() +
            9 * HOUR_MS,
          now.getTime() - daysAgo * 24 * HOUR_MS - 6 * HOUR_MS,
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
          organisationId,
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
        organisationId,
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

const MINUTE_MS = 60_000;

/**
 * Slot `k` of a type: it starts today and was made this morning, minutes apart (never before
 * today's start, UTC); a vacation runs a few working days, a sick leave one or two.
 */
const pendingSlot = (
  type: TimeOffType,
  k: number,
  today: Date,
  now: number,
): { start: Date; end: Date; note: string | null; createdAt: Date } => {
  const minutesAgo = (type === TimeOffType.SICK_DAY ? 10 : 25) + 35 * k;
  const createdAt = new Date(Math.max(today.getTime(), now - minutesAgo * MINUTE_MS));
  if (type === TimeOffType.SICK_DAY) {
    return {
      start: today,
      end: plusWorkingDays(today, 1 + (k % 2)),
      note: ['Flu', 'Migraine', 'Doctor said to stay home'][k % 3] ?? null,
      createdAt,
    };
  }
  if (type === TimeOffType.DAY_OFF) {
    return { start: today, end: plusWorkingDays(today, 1), note: 'Moving house', createdAt };
  }
  return {
    start: today,
    end: plusWorkingDays(today, 3 + (k % 2)),
    note: ['Visiting family', 'Wedding abroad', null][k % 3] ?? null,
    createdAt,
  };
};

const decisionEvent = (
  organisationId: string,
  request: { id: string; employeeId: string; type: string; startDate: Date; endDate: Date },
  status: 'APPROVED' | 'REJECTED',
  actorUserId: string | null,
  occurredAt: Date,
): Prisma.AuditEventCreateManyInput => ({
  organisationId,
  targetType: AuditTargetType.TIME_OFF_REQUEST,
  targetId: request.id,
  targetLabel: timeOffLabel(request),
  employeeId: request.employeeId,
  ipAddress: '127.0.0.1',
  userAgent: 'seed',
  occurredAt,
  action:
    status === 'APPROVED'
      ? AuditAction.TIME_OFF_REQUEST_APPROVED
      : AuditAction.TIME_OFF_REQUEST_REJECTED,
  actorUserId,
  changes: [
    {
      field: AuditField.STATUS,
      from: auditValue.timeOffStatus('PENDING'),
      to: auditValue.timeOffStatus(status),
    },
  ] satisfies AuditChange[],
});

/**
 * Brings pending requests to PENDING_MIX (dev only). Per type, those with comments and then the
 * oldest stay; the rest are approved by their first responsible person, with the history event. Missing ones are made for active employees with
 * nothing pending, within their allowance and clear of their other requests.
 */
export const seedPendingRequests = async (
  prisma: PrismaClient,
  organisationId: string,
  fallbackResponsibleId: string,
): Promise<{ decided: number; created: number }> => {
  const today = todayUtc();
  const now = Date.now();
  const pending = await prisma.timeOffRequest.findMany({
    where: { organisationId, status: 'PENDING' },
    select: {
      id: true,
      employeeId: true,
      type: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      responsibles: { select: { responsibleUserId: true }, take: 1 },
    },
    orderBy: [{ comments: { _count: 'desc' } }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  const kept = new Map<string, number>();
  const surplus = pending.filter((request) => {
    const count = kept.get(request.type) ?? 0;
    const limit = isTimeOffType(request.type) ? PENDING_MIX[request.type] : 0;
    kept.set(request.type, count + 1);
    return count >= limit;
  });
  const events: Prisma.AuditEventCreateManyInput[] = [];
  for (const request of surplus) {
    const status = 'APPROVED';
    const decider = request.responsibles[0]?.responsibleUserId ?? null;
    const decidedAt = new Date(
      Math.max(
        request.createdAt.getTime(),
        Math.min(request.createdAt.getTime() + 26 * HOUR_MS, now - 3 * HOUR_MS),
      ),
    );
    await prisma.timeOffRequest.update({
      where: { id: request.id },
      data: {
        status,
        decidedBy: decider,
        decidedAt,
        updatedBy: decider,
        updatedAt: decidedAt,
        version: { increment: 1 },
      },
      select: { id: true },
    });
    events.push(decisionEvent(organisationId, request, status, decider, decidedAt));
  }

  const busy = new Set(
    pending.filter((request) => !surplus.includes(request)).map((r) => r.employeeId),
  );
  const candidates = (
    await prisma.employee.findMany({
      where: {
        organisationId,
        startDate: { lte: plusDays(today, -30) },
        OR: [{ terminatedOn: null }, { terminatedOn: { gt: plusDays(today, 60) } }],
      },
      select: {
        id: true,
        userId: true,
        startDate: true,
        responsibles: { select: { responsibleUserId: true }, take: 10 },
        timeOffRequests: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] },
            endDate: { gte: plusDays(today, -400) },
          },
          select: { type: true, startDate: true, endDate: true, days: true },
          take: 50,
        },
      },
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
    })
  ).filter((employee) => !busy.has(employee.id));

  let created = 0;
  let next = 0;
  for (const type of TIME_OFF_TYPES) {
    const missing = PENDING_MIX[type] - Math.min(kept.get(type) ?? 0, PENDING_MIX[type]);
    for (let k = 0; k < missing; k += 1) {
      const slot = pendingSlot(type, k, today, now);
      const days = workingDaysBetween(slot.start, slot.end);
      const policy = LEAVE_POLICY[type];
      const at = candidates.findIndex((employee, offset) => {
        const candidate = candidates[(next + offset) % candidates.length] ?? employee;
        if (candidate.startDate > slot.start) {
          return false;
        }
        const overlaps = candidate.timeOffRequests.some(
          (r) => slot.start <= r.endDate && slot.end >= r.startDate,
        );
        const cycle = cycleOf(candidate.startDate, policy.cycleMonths, slot.start);
        const used = candidate.timeOffRequests
          .filter((r) => r.type === type && r.startDate >= cycle.start && r.startDate <= cycle.end)
          .reduce((sum, r) => sum + r.days, 0);
        return !overlaps && (policy.allowance === null || used + days <= policy.allowance);
      });
      if (at < 0) {
        continue;
      }
      const index = (next + at) % candidates.length;
      const [employee] = candidates.splice(index, 1);
      next = candidates.length > 0 ? index % candidates.length : 0;
      if (!employee) {
        continue;
      }
      const responsibleUserIds =
        employee.responsibles.length > 0
          ? employee.responsibles.map((r) => r.responsibleUserId)
          : [fallbackResponsibleId];
      const request = await prisma.timeOffRequest.create({
        data: {
          organisationId,
          employeeId: employee.id,
          type,
          startDate: slot.start,
          endDate: slot.end,
          days,
          status: 'PENDING',
          note: slot.note,
          createdAt: slot.createdAt,
          createdBy: employee.userId,
          updatedBy: employee.userId,
          updatedAt: slot.createdAt,
          responsibles: {
            create: responsibleUserIds.map((responsibleUserId) => ({ responsibleUserId })),
          },
        },
        select: { id: true },
      });
      created += 1;
      events.push({
        organisationId,
        targetType: AuditTargetType.TIME_OFF_REQUEST,
        targetId: request.id,
        targetLabel: timeOffLabel({ type, startDate: slot.start, endDate: slot.end }),
        employeeId: employee.id,
        ipAddress: '127.0.0.1',
        userAgent: 'seed',
        occurredAt: slot.createdAt,
        action: AuditAction.TIME_OFF_REQUEST_CREATED,
        actorUserId: employee.userId,
        changes: [
          { field: AuditField.TIME_OFF_TYPE, from: null, to: auditValue.timeOffType(type) },
          { field: AuditField.PERIOD_START, from: null, to: auditValue.date(slot.start) },
          { field: AuditField.PERIOD_END, from: null, to: auditValue.date(slot.end) },
          { field: AuditField.DAYS, from: null, to: auditValue.number(days) },
          ...(slot.note
            ? [{ field: AuditField.NOTE, from: null, to: auditValue.text(slot.note) }]
            : []),
        ] satisfies AuditChange[],
      });
    }
  }
  await prisma.auditEvent.createMany({ data: events });
  return { decided: surplus.length, created };
};

/**
 * Only admins are responsible: pending requests made when others could be get the employee's
 * current responsible people instead (dev data only; decided requests keep theirs).
 */
export const alignPendingResponsibles = async (
  prisma: PrismaClient,
  organisationId: string,
): Promise<number> => {
  const requests = await prisma.timeOffRequest.findMany({
    where: {
      organisationId,
      status: 'PENDING',
      responsibles: { some: { responsible: { role: { notIn: ['OWNER', 'ADMIN'] } } } },
    },
    select: {
      id: true,
      employee: { select: { responsibles: { select: { responsibleUserId: true }, take: 10 } } },
    },
  });
  const ids = requests.map((request) => request.id);
  await prisma.timeOffRequestResponsible.deleteMany({ where: { requestId: { in: ids } } });
  await prisma.timeOffRequestResponsible.createMany({
    data: requests.flatMap((request) =>
      request.employee.responsibles.map(({ responsibleUserId }) => ({
        organisationId,
        requestId: request.id,
        responsibleUserId,
      })),
    ),
  });
  return ids.length;
};

const COMMENTS = [
  'Checked the team calendar — no overlap with the release week.',
  'Please hand over the open tickets before you go.',
  'Discussed with the project manager, fine from the delivery side.',
  'Can you confirm the dates with the client first?',
];

/** A few admin comments on the oldest pending requests, once (dev only). */
export const seedTimeOffComments = async (
  prisma: PrismaClient,
  organisationId: string,
  admins: string[],
): Promise<number> => {
  if (
    (await prisma.timeOffRequestComment.count({ where: { organisationId } })) > 0 ||
    admins.length === 0
  ) {
    return 0;
  }
  const requests = await prisma.timeOffRequest.findMany({
    where: { organisationId, status: 'PENDING' },
    select: { id: true, createdAt: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 8,
  });
  const now = Date.now();
  const { count } = await prisma.timeOffRequestComment.createMany({
    data: requests.flatMap((request, index) =>
      COMMENTS.slice(0, 1 + (index % 2)).map((body, offset) => ({
        organisationId,
        requestId: request.id,
        authorId: admins[(index + offset) % admins.length] ?? '',
        body: COMMENTS[(index + offset) % COMMENTS.length] ?? body,
        // Hours after the request, but never before it or in the future (requests made minutes ago).
        createdAt: new Date(
          Math.max(
            request.createdAt.getTime() + (offset + 1) * MINUTE_MS,
            Math.min(
              request.createdAt.getTime() + (offset + 1) * 2 * HOUR_MS,
              now - (2 - offset) * 3 * MINUTE_MS,
            ),
          ),
        ),
      })),
    ),
  });
  return count;
};
