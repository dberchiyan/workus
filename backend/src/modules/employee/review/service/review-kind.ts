/** STARTING = the salary agreed at hire: one per employee, dated the start date, always completed. */
export const ReviewKind = {
  STARTING: 'STARTING',
  REGULAR: 'REGULAR',
} as const;
export type ReviewKind = (typeof ReviewKind)[keyof typeof ReviewKind];

export const REVIEW_KINDS = Object.values(ReviewKind) as [ReviewKind, ...ReviewKind[]];

export const isReviewKind = (value: string): value is ReviewKind =>
  (REVIEW_KINDS as readonly string[]).includes(value);

/** The title a starting review gets; admins may rename it like any other review. */
export const STARTING_REVIEW_TITLE = 'Starting salary';
