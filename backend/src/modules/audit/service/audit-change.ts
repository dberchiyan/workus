import { z } from 'zod';

import {
    MAX_CHANGES_PER_EVENT,
    MAX_LABEL_LENGTH,
    MAX_PEOPLE_IN_CHANGE,
    MAX_PERSON_NAME_LENGTH,
    MAX_STATUS_LENGTH,
    MAX_TYPE_LENGTH,
} from '../../../common/dto/limits';
import { MoneySchema } from '../../../common/dto/money';
import { isoDay } from '../../../common/time/iso-day';

const PersonSchema = z.object({
    id: z.uuid(),
    firstName: z.string().max(MAX_PERSON_NAME_LENGTH),
    lastName: z.string().max(MAX_PERSON_NAME_LENGTH),
});

export const AuditValueSchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), text: z.string().max(MAX_LABEL_LENGTH) }),
    z.object({ kind: z.literal('date'), at: z.iso.date() }),
    z.object({ kind: z.literal('money'), money: MoneySchema }),
    z.object({ kind: z.literal('reviewStatus'), status: z.string().max(MAX_STATUS_LENGTH) }),
    z.object({ kind: z.literal('people'), people: z.array(PersonSchema).max(MAX_PEOPLE_IN_CHANGE) }),
    z.object({ kind: z.literal('feedback') }),
    z.object({ kind: z.literal('terminationReason'), reason: z.string().max(MAX_STATUS_LENGTH) }),
    z.object({ kind: z.literal('redacted') }),
    z.object({ kind: z.literal('timeOffType'), type: z.string().max(MAX_TYPE_LENGTH) }),
    z.object({ kind: z.literal('timeOffStatus'), status: z.string().max(MAX_TYPE_LENGTH) }),
    z.object({ kind: z.literal('number'), number: z.number().int() }),
    z.object({ kind: z.literal('flag'), flag: z.boolean() }),
]);
export type AuditValue = z.infer<typeof AuditValueSchema>;

export const AuditField = {
    TITLE: 'title',
    REVIEWED_AT: 'reviewedAt',
    HELD_AT: 'heldAt',
    STATUS: 'status',
    SALARY: 'salary',
    RESPONSIBLES: 'responsibles',
    FEEDBACK_HR: 'feedbackHr',
    FEEDBACK_TEAM_LEAD: 'feedbackTeamLead',
    FEEDBACK_TEAM: 'feedbackTeam',
    FEEDBACK_CLIENT: 'feedbackClient',
    POSITION: 'position',
    STARTS_AT: 'startsAt',
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    EMAIL: 'email',
    MOBILE: 'mobile',
    PERSONAL_EMAIL: 'personalEmail',
    LINKEDIN_URL: 'linkedinUrl',
    TELEGRAM: 'telegram',
    ADDRESS: 'address',
    BORN_AT: 'bornAt',
    TERMINATED_AT: 'terminatedAt',
    TERMINATION_REASON: 'terminationReason',
    TERMINATION_COMMENT: 'terminationComment',
    TIME_OFF_TYPE: 'timeOffType',
    PERIOD_STARTS_AT: 'periodStartsAt',
    PERIOD_ENDS_AT: 'periodEndsAt',
    DAYS: 'days',
    NOTE: 'note',
    DECISION_COMMENT: 'decisionComment',
    NAME: 'name',
    RECURRING: 'isRecurring',
    ROLE: 'role',
    PLAN: 'plan',
} as const;
export type AuditField = (typeof AuditField)[keyof typeof AuditField];
export const AUDIT_FIELDS = Object.values(AuditField) as [AuditField, ...AuditField[]];

export const AuditChangeSchema = z.object({
    field: z.enum(AUDIT_FIELDS),
    from: AuditValueSchema.nullable(),
    to: AuditValueSchema.nullable(),
});
export type AuditChange = z.infer<typeof AuditChangeSchema>;

export const AuditChangesSchema = z.array(AuditChangeSchema).max(MAX_CHANGES_PER_EVENT);

export const auditValue = {
    text: (text: string): AuditValue => ({ kind: 'text', text: text.slice(0, MAX_LABEL_LENGTH) }),
    date: (date: Date): AuditValue => ({ kind: 'date', at: isoDay(date) }),
    money: (money: z.infer<typeof MoneySchema>): AuditValue => ({ kind: 'money', money }),
    reviewStatus: (status: string): AuditValue => ({ kind: 'reviewStatus', status }),
    people: (people: z.infer<typeof PersonSchema>[]): AuditValue => ({ kind: 'people', people }),
    feedback: (): AuditValue => ({ kind: 'feedback' }),
    terminationReason: (reason: string): AuditValue => ({ kind: 'terminationReason', reason }),
    redacted: (): AuditValue => ({ kind: 'redacted' }),
    timeOffType: (type: string): AuditValue => ({ kind: 'timeOffType', type }),
    timeOffStatus: (status: string): AuditValue => ({ kind: 'timeOffStatus', status }),
    number: (number: number): AuditValue => ({ kind: 'number', number }),
    flag: (flag: boolean): AuditValue => ({ kind: 'flag', flag }),
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
            (key) => key in rightRecord && isSameJson((left as Record<string, unknown>)[key], rightRecord[key]),
        )
    );
};

/** A change entry, or nothing when before and after are the same. */
export const changeOf = (field: AuditField, from: AuditValue | null, to: AuditValue | null): AuditChange[] =>
    isSameJson(from, to) ? [] : [{ field, from, to }];
