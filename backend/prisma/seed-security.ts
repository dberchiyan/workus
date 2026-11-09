import type { PrismaClient } from '../src/generated/prisma/client';
import { AuditAction, AuditTargetType } from '../src/modules/audit/service/audit-action';
import { UserRole } from '../src/modules/user/service/user-role';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** How far back the story goes (at most; never before the account existed). */
const WINDOW_DAYS = 21;
/** Accounts are created two weeks before the start date (as in the seeded Activity). */
const ADDED_BEFORE_START_DAYS = 14;
/** Marks the seeded rows, so a second run skips them while real sign-ins never count. */
const SEED_TRACE = 'seed-security-log';

const DEVICES = {
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.1 Safari/605.1.15',
  windowsEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 19_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.1 Mobile/15E148 Safari/604.1',
  android:
    'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
  stranger: 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
} as const;
type Device = keyof typeof DEVICES;

/** Each person's computer and phone, by turns. */
const DEVICE_PAIRS: readonly [Device, Device][] = [
  ['macChrome', 'iphone'],
  ['windowsEdge', 'android'],
  ['macSafari', 'iphone'],
  ['windowsEdge', 'iphone'],
  ['macChrome', 'android'],
];

// Documentation address ranges (RFC 5737): plausible, never a real person's address.
const ipOf = (place: 'office' | 'home' | 'mobile' | 'stranger', index: number): string =>
  ({
    office: `198.51.100.${10 + (index % 40)}`,
    home: `203.0.113.${20 + (index % 90)}`,
    mobile: `203.0.113.${150 + (index % 90)}`,
    stranger: `192.0.2.${60 + (index % 120)}`,
  })[place];

type Action = (typeof AuditAction)[keyof typeof AuditAction];

interface Step {
  action: Action;
  /** Place in the person's window: 0 = its start, 1 = its end. */
  at: number;
  actor: 'self' | 'none' | 'admin';
  place: 'office' | 'home' | 'mobile' | 'stranger';
  device: 'computer' | 'phone' | 'stranger';
}

/**
 * At most five events per security-log tab (Sign-ins, Failed, Password, Sessions), varied by the
 * person's place in the list: their computer and phone (each one's first sign-in reads as a new
 * device), now and then a stranger's wrong passwords (every third person also locked out), a
 * password reset by an admin (every second person; the others change it themselves), ended sessions.
 */
const storyFor = (index: number): Step[] => {
  const steps: Step[] = [
    {
      action: AuditAction.AUTH_SIGNED_IN,
      at: 0.02,
      actor: 'self',
      place: 'office',
      device: 'computer',
    },
    {
      action: AuditAction.AUTH_SIGNED_IN,
      at: 0.2,
      actor: 'self',
      place: 'mobile',
      device: 'phone',
    },
  ];
  if (index % 2 === 0) {
    steps.push(
      {
        action: AuditAction.AUTH_PASSWORD_RESET,
        at: 0.35,
        actor: 'admin',
        place: 'office',
        device: 'computer',
      },
      {
        action: AuditAction.AUTH_SIGNED_IN,
        at: 0.36,
        actor: 'self',
        place: 'office',
        device: 'computer',
      },
    );
  } else {
    steps.push({
      action: AuditAction.AUTH_PASSWORD_CHANGED,
      at: 0.3,
      actor: 'self',
      place: 'home',
      device: 'computer',
    });
  }
  if (index % 3 !== 1) {
    steps.push(
      {
        action: AuditAction.AUTH_SIGN_IN_FAILED,
        at: 0.5,
        actor: 'none',
        place: 'stranger',
        device: 'stranger',
      },
      {
        action: AuditAction.AUTH_SIGN_IN_FAILED,
        at: 0.502,
        actor: 'none',
        place: 'stranger',
        device: 'stranger',
      },
    );
    if (index % 3 === 0) {
      steps.push({
        action: AuditAction.AUTH_SIGN_IN_LOCKED,
        at: 0.503,
        actor: 'none',
        place: 'stranger',
        device: 'stranger',
      });
    }
  } else {
    // Their own typo this time.
    steps.push({
      action: AuditAction.AUTH_SIGN_IN_FAILED,
      at: 0.5,
      actor: 'none',
      place: 'home',
      device: 'computer',
    });
  }
  steps.push(
    {
      action: AuditAction.AUTH_SIGNED_IN,
      at: 0.6,
      actor: 'self',
      place: 'home',
      device: 'computer',
    },
    {
      action: AuditAction.AUTH_SESSION_ENDED,
      at: 0.62,
      actor: 'self',
      place: 'home',
      device: 'computer',
    },
    {
      action: AuditAction.AUTH_SIGNED_OUT,
      at: 0.8,
      actor: 'self',
      place: 'mobile',
      device: 'phone',
    },
  );
  if (index % 2 === 1) {
    steps.push({
      action: AuditAction.AUTH_OTHER_SESSIONS_ENDED,
      at: 0.9,
      actor: 'self',
      place: 'office',
      device: 'computer',
    });
  }
  return steps;
};

/**
 * A security log for every employee (dev only, once per person — skipped for whoever has the
 * seeded story already; real sign-ins neither block nor double it). Written the way the server
 * writes them: target the user, no employee, no changes. A person who has left ends with the
 * sessions closed at the termination and a refused sign-in after it.
 */
export const seedSecurityLog = async (
  prisma: PrismaClient,
  organisationId: string,
): Promise<number> => {
  const now = Date.now();
  const seeded = new Set(
    (
      await prisma.auditEvent.findMany({
        where: { organisationId, traceId: SEED_TRACE },
        select: { targetId: true },
        distinct: ['targetId'],
      })
    ).map((event) => event.targetId),
  );
  const admin = await prisma.user.findFirst({
    where: { organisationId, role: UserRole.ADMIN },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  const employees = await prisma.employee.findMany({
    where: { organisationId },
    select: { userId: true, startDate: true, terminatedOn: true },
    orderBy: { startDate: 'asc' },
  });

  const rows = employees.flatMap((employee, index) => {
    const added = employee.startDate.getTime() - ADDED_BEFORE_START_DAYS * DAY_MS;
    const left = employee.terminatedOn ? employee.terminatedOn.getTime() + 9 * HOUR_MS : null;
    const from = Math.max(now - WINDOW_DAYS * DAY_MS, added + 9 * HOUR_MS);
    const to = Math.min(now - 2 * HOUR_MS, left ?? Infinity);
    if (seeded.has(employee.userId) || to - from < DAY_MS) {
      return [];
    }
    const [computer, phone] = DEVICE_PAIRS[index % DEVICE_PAIRS.length] ?? ['macChrome', 'iphone'];
    const device = { computer, phone, stranger: 'stranger' as const };
    const actorOf = (actor: Step['actor']): string | null =>
      actor === 'self' ? employee.userId : actor === 'admin' ? (admin?.id ?? null) : null;
    const event = (
      action: Action,
      occurredAt: number,
      actor: string | null,
      ip: string,
      userAgent: string | null,
    ) => ({
      organisationId,
      occurredAt: new Date(occurredAt),
      action,
      actorUserId: actor,
      employeeId: null,
      targetType: AuditTargetType.USER,
      targetId: employee.userId,
      targetLabel: 'account',
      changes: [],
      ipAddress: ip,
      userAgent,
      traceId: SEED_TRACE,
    });
    // A minute's jitter per person, so two people's lines never read the same.
    const jitter = (index % 7) * 7 * 60_000;
    const story = storyFor(index)
      .filter((step) => step.actor !== 'admin' || admin)
      .map((step) =>
        event(
          step.action,
          from + step.at * (to - from) + jitter,
          actorOf(step.actor),
          ipOf(step.place, index),
          DEVICES[device[step.device]],
        ),
      );
    if (left !== null && left < now) {
      // Ended by the admin who recorded the termination; a sign-in a day later is refused.
      story.push(
        event(
          AuditAction.AUTH_SESSIONS_ENDED_ON_TERMINATION,
          left,
          admin?.id ?? null,
          ipOf('office', 0),
          null,
        ),
      );
      if (left + DAY_MS < now) {
        story.push(
          event(
            AuditAction.AUTH_SIGN_IN_REFUSED,
            left + DAY_MS,
            employee.userId,
            ipOf('home', index),
            DEVICES[computer],
          ),
        );
      }
    }
    return story;
  });
  const { count } = await prisma.auditEvent.createMany({ data: rows });
  return count;
};
