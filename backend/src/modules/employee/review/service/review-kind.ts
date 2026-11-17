export const ReviewKind = {
    STARTING: 'STARTING',
    REGULAR: 'REGULAR',
} as const;
export type ReviewKind = (typeof ReviewKind)[keyof typeof ReviewKind];

export const REVIEW_KINDS = Object.values(ReviewKind) as [ReviewKind, ...ReviewKind[]];

export const isReviewKind = (value: string): value is ReviewKind => (REVIEW_KINDS as readonly string[]).includes(value);

export const STARTING_REVIEW_TITLE = 'Starting salary';
