import type { Prisma, PrismaClient } from '../src/generated/prisma/client';
import { toMoney } from '../src/common/persistence/money';
import { AuditAction, AuditTargetType } from '../src/modules/audit/service/audit-action';
import {
  type AuditChange,
  AuditField,
  auditValue,
} from '../src/modules/audit/service/audit-change';
import { ReviewKind } from '../src/modules/employee/review/service/review-kind';

const DAY_MS = 86_400_000;
const shift = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);
/** History never lies in the future: clamp to "a few hours ago". */
const past = (date: Date, now: Date): Date =>
  date < now ? date : new Date(now.getTime() - 3 * 3_600_000);

const person = (user: { id: string; firstName: string; lastName: string }) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
});

const FEEDBACK_COLUMNS = [
  ['feedbackHr', AuditField.FEEDBACK_HR],
  ['feedbackLead', AuditField.FEEDBACK_TEAM_LEAD],
  ['feedbackTeam', AuditField.FEEDBACK_TEAM],
  ['feedbackClient', AuditField.FEEDBACK_CLIENT],
] as const;

/**
 * Plausible history for seeded data: each employee "added" two weeks before the start, together
 * with the starting salary; each other review created as scheduled a month ahead, then completed (salary + feedback) or canceled;
 * every seventh person also has a check-in that was added and deleted. Admins take turns.
 * Skips employees that already have history.
 */
export const seedActivity = async (prisma: PrismaClient, adminIds: string[]): Promise<number> => {
  const now = new Date();
  const employees = await prisma.employee.findMany({
    where: { auditEvents: { none: {} } },
    select: {
      id: true,
      startDate: true,
      terminatedOn: true,
      terminationReason: true,
      terminationComment: true,
      user: { select: { firstName: true, lastName: true } },
      position: { select: { title: true } },
      responsibles: {
        select: { responsible: { select: { id: true, firstName: true, lastName: true } } },
        take: 10,
      },
      employeeReviews: {
        select: {
          id: true,
          kind: true,
          title: true,
          reviewDate: true,
          status: true,
          salaryAmount: true,
          salaryCurrency: true,
          feedbackHr: true,
          feedbackLead: true,
          feedbackTeam: true,
          feedbackClient: true,
          responsibles: {
            select: { responsible: { select: { id: true, firstName: true, lastName: true } } },
            take: 10,
          },
        },
        orderBy: { reviewDate: 'asc' },
        take: 100,
      },
    },
    orderBy: { startDate: 'asc' },
  });

  const events: Prisma.AuditEventCreateManyInput[] = [];
  const actor = (n: number): string | null => adminIds[n % adminIds.length] ?? null;
  const event = (
    n: number,
    occurredAt: Date,
    action: AuditAction,
    employeeId: string,
    target: { type: string; id: string; label: string },
    changes: AuditChange[],
  ): void => {
    events.push({
      occurredAt,
      action,
      actorUserId: actor(n),
      employeeId,
      targetType: target.type,
      targetId: target.id,
      targetLabel: target.label,
      changes,
      ipAddress: '127.0.0.1',
      userAgent: 'seed',
    });
  };

  for (const [index, employee] of employees.entries()) {
    const responsibles = employee.responsibles.map(({ responsible }) => person(responsible));
    const hiredAt = past(shift(employee.startDate, -14), now);
    event(
      index,
      hiredAt,
      AuditAction.EMPLOYEE_CREATED,
      employee.id,
      {
        type: AuditTargetType.EMPLOYEE,
        id: employee.id,
        label: `${employee.user.firstName} ${employee.user.lastName}`,
      },
      [
        { field: AuditField.POSITION, from: null, to: auditValue.text(employee.position.title) },
        { field: AuditField.START_DATE, from: null, to: auditValue.date(employee.startDate) },
        ...(responsibles.length > 0
          ? [{ field: AuditField.RESPONSIBLES, from: null, to: auditValue.people(responsibles) }]
          : []),
      ],
    );

    for (const [round, review] of employee.employeeReviews.entries()) {
      const n = index + round + 1;
      const target = { type: AuditTargetType.REVIEW, id: review.id, label: review.title };
      const people = auditValue.people(
        review.responsibles.map(({ responsible }) => person(responsible)),
      );
      if (review.kind === ReviewKind.STARTING && review.salaryAmount && review.salaryCurrency) {
        // Added with the employee, in the same step (a millisecond later, so it sorts above).
        event(
          index,
          new Date(hiredAt.getTime() + 1),
          AuditAction.REVIEW_CREATED,
          employee.id,
          target,
          [
            { field: AuditField.TITLE, from: null, to: auditValue.text(review.title) },
            { field: AuditField.DATE, from: null, to: auditValue.date(review.reviewDate) },
            { field: AuditField.STATUS, from: null, to: auditValue.reviewStatus('COMPLETED') },
            {
              field: AuditField.SALARY,
              from: null,
              to: auditValue.money(toMoney(review.salaryAmount, review.salaryCurrency)),
            },
            { field: AuditField.RESPONSIBLES, from: null, to: people },
          ],
        );
        continue;
      }
      const scheduled = auditValue.reviewStatus('SCHEDULED');
      event(
        n,
        past(shift(review.reviewDate, -30), now),
        AuditAction.REVIEW_CREATED,
        employee.id,
        target,
        [
          { field: AuditField.TITLE, from: null, to: auditValue.text(review.title) },
          { field: AuditField.DATE, from: null, to: auditValue.date(review.reviewDate) },
          { field: AuditField.STATUS, from: null, to: scheduled },
          { field: AuditField.RESPONSIBLES, from: null, to: people },
        ],
      );
      if (review.status === 'COMPLETED' && review.salaryAmount && review.salaryCurrency) {
        event(
          n + 1,
          past(shift(review.reviewDate, 1), now),
          AuditAction.REVIEW_UPDATED,
          employee.id,
          target,
          [
            { field: AuditField.STATUS, from: scheduled, to: auditValue.reviewStatus('COMPLETED') },
            {
              field: AuditField.SALARY,
              from: null,
              to: auditValue.money(toMoney(review.salaryAmount, review.salaryCurrency)),
            },
            ...FEEDBACK_COLUMNS.flatMap(([column, field]) =>
              review[column] === null ? [] : [{ field, from: null, to: auditValue.feedback() }],
            ),
          ],
        );
      } else if (review.status === 'CANCELED') {
        event(
          n + 1,
          past(shift(review.reviewDate, -5), now),
          AuditAction.REVIEW_UPDATED,
          employee.id,
          target,
          [{ field: AuditField.STATUS, from: scheduled, to: auditValue.reviewStatus('CANCELED') }],
        );
      }
    }

    if (employee.terminatedOn && employee.terminationReason) {
      // Recorded two weeks before the last day (or a few hours ago when that is in the future).
      event(
        index + 1,
        past(shift(employee.terminatedOn, -14), now),
        AuditAction.EMPLOYEE_TERMINATED,
        employee.id,
        {
          type: AuditTargetType.EMPLOYEE,
          id: employee.id,
          label: `${employee.user.firstName} ${employee.user.lastName}`,
        },
        [
          {
            field: AuditField.TERMINATION_DATE,
            from: null,
            to: auditValue.date(employee.terminatedOn),
          },
          {
            field: AuditField.TERMINATION_REASON,
            from: null,
            to: auditValue.terminationReason(employee.terminationReason),
          },
          ...(employee.terminationComment
            ? [
                {
                  field: AuditField.TERMINATION_COMMENT,
                  from: null,
                  to: auditValue.text(employee.terminationComment),
                },
              ]
            : []),
        ],
      );
    }

    if (index % 7 === 3) {
      const checkInDate = shift(employee.startDate, 90);
      const target = { type: AuditTargetType.REVIEW, id: crypto.randomUUID(), label: 'Check-in' };
      const values: AuditChange[] = [
        { field: AuditField.TITLE, from: null, to: auditValue.text('Check-in') },
        { field: AuditField.DATE, from: null, to: auditValue.date(checkInDate) },
        { field: AuditField.STATUS, from: null, to: auditValue.reviewStatus('SCHEDULED') },
      ];
      event(
        index,
        past(shift(checkInDate, -20), now),
        AuditAction.REVIEW_CREATED,
        employee.id,
        target,
        values,
      );
      event(
        index + 1,
        past(shift(checkInDate, -18), now),
        AuditAction.REVIEW_DELETED,
        employee.id,
        target,
        values.map((change) => ({ ...change, from: change.to, to: null })),
      );
    }
  }

  const { count } = await prisma.auditEvent.createMany({ data: events });
  return count;
};
