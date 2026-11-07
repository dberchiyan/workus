import { z } from 'zod';
import { MoneySchema } from '../../../common/dto/money';

/**
 * One value in a change summary. Typed, so the client formats it (dates, money, people) and
 * never parses free text. Feedback is logged as present/absent only — its text stays out of the log;
 * personal contacts are logged as "changed" (`redacted`) without their values.
 */
const PersonSchema = z.object({
  id: z.uuid(),
  firstName: z.string().max(100),
  lastName: z.string().max(100),
});

export const AuditValueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text: z.string().max(255) }),
  z.object({ kind: z.literal('date'), date: z.iso.date() }),
  z.object({ kind: z.literal('money'), money: MoneySchema }),
  z.object({ kind: z.literal('reviewStatus'), status: z.string().max(32) }),
  z.object({ kind: z.literal('people'), people: z.array(PersonSchema).max(20) }),
  z.object({ kind: z.literal('feedback') }),
  z.object({ kind: z.literal('terminationReason'), reason: z.string().max(32) }),
  z.object({ kind: z.literal('redacted') }),
  z.object({ kind: z.literal('timeOffType'), type: z.string().max(16) }),
  z.object({ kind: z.literal('timeOffStatus'), status: z.string().max(16) }),
  z.object({ kind: z.literal('number'), number: z.number().int() }),
]);
export type AuditValue = z.infer<typeof AuditValueSchema>;

export const AuditField = {
  TITLE: 'title',
  DATE: 'date',
  STATUS: 'status',
  SALARY: 'salary',
  RESPONSIBLES: 'responsibles',
  FEEDBACK_HR: 'feedbackHr',
  FEEDBACK_TEAM_LEAD: 'feedbackTeamLead',
  FEEDBACK_TEAM: 'feedbackTeam',
  FEEDBACK_CLIENT: 'feedbackClient',
  POSITION: 'position',
  START_DATE: 'startDate',
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  EMAIL: 'email',
  MOBILE: 'mobile',
  PERSONAL_EMAIL: 'personalEmail',
  LINKEDIN_URL: 'linkedinUrl',
  TELEGRAM: 'telegram',
  ADDRESS: 'address',
  DATE_OF_BIRTH: 'dateOfBirth',
  TERMINATION_DATE: 'terminationDate',
  TERMINATION_REASON: 'terminationReason',
  TERMINATION_COMMENT: 'terminationComment',
  TIME_OFF_TYPE: 'timeOffType',
  PERIOD_START: 'periodStart',
  PERIOD_END: 'periodEnd',
  DAYS: 'days',
  NOTE: 'note',
  DECISION_COMMENT: 'decisionComment',
} as const;
export type AuditField = (typeof AuditField)[keyof typeof AuditField];
export const AUDIT_FIELDS = Object.values(AuditField) as [AuditField, ...AuditField[]];

export const AuditChangeSchema = z.object({
  field: z.enum(AUDIT_FIELDS),
  /** null = the field had no value (created), or has none now (deleted / cleared). */
  from: AuditValueSchema.nullable(),
  to: AuditValueSchema.nullable(),
});
export type AuditChange = z.infer<typeof AuditChangeSchema>;

export const AuditChangesSchema = z.array(AuditChangeSchema).max(32);

/** Value builders, so callers never hand-write the tagged shapes. */
export const auditValue = {
  text: (text: string): AuditValue => ({ kind: 'text', text: text.slice(0, 255) }),
  date: (date: Date): AuditValue => ({ kind: 'date', date: date.toISOString().slice(0, 10) }),
  money: (money: z.infer<typeof MoneySchema>): AuditValue => ({ kind: 'money', money }),
  reviewStatus: (status: string): AuditValue => ({ kind: 'reviewStatus', status }),
  people: (people: z.infer<typeof PersonSchema>[]): AuditValue => ({ kind: 'people', people }),
  feedback: (): AuditValue => ({ kind: 'feedback' }),
  terminationReason: (reason: string): AuditValue => ({ kind: 'terminationReason', reason }),
  redacted: (): AuditValue => ({ kind: 'redacted' }),
  timeOffType: (type: string): AuditValue => ({ kind: 'timeOffType', type }),
  timeOffStatus: (status: string): AuditValue => ({ kind: 'timeOffStatus', status }),
  number: (number: number): AuditValue => ({ kind: 'number', number }),
};

/** Deep equality for JSON values; jsonb reorders object keys, so key order is ignored. */
export const isSameJson = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true;
  }
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => isSameJson(item, right[index]))
    );
  }
  const leftKeys = Object.keys(left);
  const rightRecord = right as Record<string, unknown>;
  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every(
      (key) =>
        key in rightRecord && isSameJson((left as Record<string, unknown>)[key], rightRecord[key]),
    )
  );
};

/** A change entry, or nothing when before and after are the same. */
export const changeOf = (
  field: AuditField,
  from: AuditValue | null,
  to: AuditValue | null,
): AuditChange[] => (isSameJson(from, to) ? [] : [{ field, from, to }]);
