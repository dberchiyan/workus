import { toMoney } from '../../../../common/persistence/money';
import {
  type AuditChange,
  AuditField,
  type AuditValue,
  auditValue,
  changeOf,
  isSameJson,
} from '../../../audit/service/audit-change';
import type { ReviewRecord } from '../repository/record/review.record';
import { isEmptyRichText, readRichText } from './rich-text';

type FeedbackColumn = 'feedbackHr' | 'feedbackLead' | 'feedbackTeam' | 'feedbackClient';

const FEEDBACK_FIELDS: readonly [FeedbackColumn, AuditField][] = [
  ['feedbackHr', AuditField.FEEDBACK_HR],
  ['feedbackLead', AuditField.FEEDBACK_TEAM_LEAD],
  ['feedbackTeam', AuditField.FEEDBACK_TEAM],
  ['feedbackClient', AuditField.FEEDBACK_CLIENT],
];

const feedbackDoc = (review: ReviewRecord, column: FeedbackColumn) => {
  const doc = readRichText(review[column]);
  return doc && !isEmptyRichText(doc) ? doc : null;
};

/** Plain fields; feedback is handled apart (logged as present/absent, never its text). */
const plainValues = (review: ReviewRecord): [AuditField, AuditValue | null][] => [
  [AuditField.TITLE, auditValue.text(review.title)],
  [AuditField.DATE, auditValue.date(review.reviewDate)],
  [AuditField.STATUS, auditValue.reviewStatus(review.status)],
  [
    AuditField.SALARY,
    review.salaryAmount && review.salaryCurrency
      ? auditValue.money(toMoney(review.salaryAmount, review.salaryCurrency))
      : null,
  ],
  [
    AuditField.RESPONSIBLES,
    auditValue.people(
      review.responsibles
        .map(({ responsible }) => responsible)
        .toSorted((left, right) => left.id.localeCompare(right.id)),
    ),
  ],
];

/** Everything the new review holds. */
export const reviewCreatedChanges = (review: ReviewRecord): AuditChange[] => [
  ...plainValues(review).flatMap(([field, value]) => changeOf(field, null, value)),
  ...FEEDBACK_FIELDS.flatMap(([column, field]) =>
    feedbackDoc(review, column) ? changeOf(field, null, auditValue.feedback()) : [],
  ),
];

/** Only what differs; edited feedback is `feedback → feedback` (text not logged). */
export const reviewUpdatedChanges = (before: ReviewRecord, after: ReviewRecord): AuditChange[] => {
  const afterValues = new Map(plainValues(after));
  return [
    ...plainValues(before).flatMap(([field, value]) =>
      changeOf(field, value, afterValues.get(field) ?? null),
    ),
    ...FEEDBACK_FIELDS.flatMap(([column, field]): AuditChange[] => {
      const from = feedbackDoc(before, column);
      const to = feedbackDoc(after, column);
      if (isSameJson(from, to)) {
        return [];
      }
      return [
        {
          field,
          from: from ? auditValue.feedback() : null,
          to: to ? auditValue.feedback() : null,
        },
      ];
    }),
  ];
};

/** What the review held when it was deleted. */
export const reviewDeletedChanges = (review: ReviewRecord): AuditChange[] =>
  reviewCreatedChanges(review).map((change) => ({ ...change, from: change.to, to: null }));
