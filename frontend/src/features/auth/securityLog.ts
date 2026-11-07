import type { SecurityCategory, SecurityEvent, SecurityLog } from './types';

type Action = SecurityEvent['action'];

/** The filter row, in order; `undefined` is "All". */
export const SECURITY_CATEGORIES = [
  'SIGN_INS',
  'FAILED',
  'PASSWORD',
  'SESSIONS',
] as const satisfies readonly SecurityCategory[];

export const isSecurityCategory = (value: unknown): value is SecurityCategory =>
  SECURITY_CATEGORIES.some((category) => category === value);

/**
 * How an entry looks: `danger` — someone could not get in (red); `critical` — the account itself
 * changed or every device was signed out (highlighted); `normal` — everything else.
 */
export type SecurityTone = 'normal' | 'danger' | 'critical';

export const SECURITY_TONES: Record<Action, SecurityTone> = {
  'auth.signed_in': 'normal',
  'auth.sign_in_failed': 'danger',
  'auth.sign_in_refused': 'danger',
  'auth.signed_out': 'normal',
  'auth.password_changed': 'critical',
  'auth.session_ended': 'normal',
  'auth.other_sessions_ended': 'critical',
  'auth.session_evicted': 'normal',
  'auth.sessions_ended_on_termination': 'critical',
  'auth.sign_in_locked': 'danger',
};

/** Events this close (and alike, from one device) fold into one row. */
const GROUP_GAP_MS = 30 * 60_000;

/** Which events may share a row: sign-ins and sign-outs together, otherwise the same action. */
const kindOf = (action: Action): string =>
  action === 'auth.signed_in' || action === 'auth.signed_out' ? 'session' : action;

/** Critical events always stand alone — they must not hide inside a group. */
const groupable = (action: Action): boolean => SECURITY_TONES[action] !== 'critical';

export interface SecurityEventGroup {
  /** The newest event's id. */
  id: string;
  /** Newest first; one or more. */
  events: SecurityEvent[];
}

export interface SecurityDay {
  /** `YYYY-MM-DD`, UTC (days are UTC everywhere). */
  day: string;
  groups: SecurityEventGroup[];
}

const dayOf = (iso: string): string => iso.slice(0, 10);

const sameRow = (group: SecurityEventGroup, event: SecurityEvent): boolean => {
  const last = group.events[group.events.length - 1];
  if (!last || !groupable(last.action) || !groupable(event.action)) {
    return false;
  }
  return (
    kindOf(last.action) === kindOf(event.action) &&
    last.userAgent === event.userAgent &&
    last.ip === event.ip &&
    dayOf(last.occurredAt) === dayOf(event.occurredAt) &&
    new Date(last.occurredAt).getTime() - new Date(event.occurredAt).getTime() <= GROUP_GAP_MS
  );
};

/**
 * Newest-first events → days (UTC) → rows: neighbouring events of one kind, from one device
 * (browser and IP), less than 30 minutes apart, share a row.
 */
export const groupSecurityEvents = (events: readonly SecurityEvent[]): SecurityDay[] => {
  const days: SecurityDay[] = [];
  for (const event of events) {
    const day = dayOf(event.occurredAt);
    let current = days[days.length - 1];
    if (current?.day !== day) {
      current = { day, groups: [] };
      days.push(current);
    }
    const group = current.groups[current.groups.length - 1];
    if (group && sameRow(group, event)) {
      group.events.push(event);
    } else {
      current.groups.push({ id: event.id, events: [event] });
    }
  }
  return days;
};

/** The next page to load, or none when every event is on screen. */
export const nextSecurityLogPage = (
  last: SecurityLog,
  pages: readonly SecurityLog[],
): number | undefined =>
  pages.reduce((sum, page) => sum + page.content.length, 0) < last.totalElements
    ? pages.length
    : undefined;
