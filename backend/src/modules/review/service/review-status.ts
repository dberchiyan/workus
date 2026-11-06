export const ReviewStatus = {
  COMPLETED: 'COMPLETED',
  SCHEDULED: 'SCHEDULED',
  CANCELED: 'CANCELED',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const REVIEW_STATUSES = Object.values(ReviewStatus) as [ReviewStatus, ...ReviewStatus[]];

export const isReviewStatus = (value: string): value is ReviewStatus =>
  (REVIEW_STATUSES as readonly string[]).includes(value);
