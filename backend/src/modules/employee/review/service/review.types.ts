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
    changePercent: string | null;
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

export interface StartingReviewCommand {
    startsAt: string;
    salary: string;
    responsibleUserIds: string[];
}

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
