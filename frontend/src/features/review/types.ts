import type { Schemas } from '@/shared/types';

export type EmployeeReviews = Schemas['EmployeeReviewsResponse_Output'];
export type Review = Schemas['Review_Output'];
export type ReviewStatus = Schemas['ReviewStatus_Output'];
export type CreateReviewRequest = Schemas['CreateReviewRequest'];
export type SalaryPoint = EmployeeReviews['salary']['history'][number];
export type ReviewCandidate = Schemas['ResponsibleCandidatesResponse_Output']['content'][number];
export type ReviewCandidateOption = ReviewCandidate & { subtitle: string };
export type UpdateReviewRequest = Schemas['UpdateReviewRequest'];

/** Rich-text feedback document (TipTap JSON), as generated from the API. */
export type RichTextDoc = NonNullable<Review['feedback']['hr']>;
export const FEEDBACK_SOURCES = ['hr', 'teamLead', 'team', 'client'] as const;
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];
