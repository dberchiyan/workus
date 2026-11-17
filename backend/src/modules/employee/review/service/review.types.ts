import type { Decimal } from '../../../../common/persistence/money';
import type { ReviewRecord } from '../repository/record/review.record';
import type { ReviewStatus } from './review-status';
import type { RichTextDoc } from './rich-text';

export interface SalaryPoint {
    reviewedAt: Date;
    amount: Decimal;
    currency: string;
}

export interface SalaryOverview {
    current: SalaryPoint | null;
    previous: SalaryPoint | null;
    /** Percent vs the previous completed review, e.g. "12.5"; null without a previous one. */
    changePercent: string | null;
    /** Oldest first, completed reviews only. */
    history: SalaryPoint[];
}

export interface EmployeeReviews {
    salary: SalaryOverview;
    reviews: ReviewRecord[];
}

export interface CreateReviewCommand {
    title: string;
    reviewedAt: string;
    status: ReviewStatus;
    /** Validated decimal string, USD per month. */
    salary: string | undefined;
    responsibleUserIds: string[];
    feedback: {
        hr?: RichTextDoc | null | undefined;
        teamLead?: RichTextDoc | null | undefined;
        team?: RichTextDoc | null | undefined;
        client?: RichTextDoc | null | undefined;
    };
}

export type UpdateReviewCommand = CreateReviewCommand & { version: number };

/** The salary agreed at hire, recorded as the employee's starting review. */
export interface StartingReviewCommand {
    /** The employee's start reviewedAt (YYYY-MM-DD). */
    startsAt: string;
    /** Validated decimal string, USD per month. */
    salary: string;
    responsibleUserIds: string[];
}

/** A review on the admin dashboard (status as stored — guarded by its CHECK). */
export interface DashboardReview {
    id: string;
    title: string;
    reviewedAt: Date;
    status: string;
    employee: {
        id: string;
        userId: string;
        firstName: string;
        lastName: string;
        positionTitle: string;
    };
}

export interface DashboardReviews {
    content: DashboardReview[];
    totalElements: number;
}
