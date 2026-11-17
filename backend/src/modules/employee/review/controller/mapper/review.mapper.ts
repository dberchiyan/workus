import { toMoney } from '../../../../../common/persistence/money';
import { isoDay as isoDate } from '../../../../../common/time/iso-day';
import type { ReviewRecord } from '../../repository/record/review.record';
import type { EmployeeReviews, SalaryPoint } from '../../service/review.types';
import { isReviewKind, ReviewKind } from '../../service/review-kind';
import { isReviewStatus, ReviewStatus } from '../../service/review-status';
import { readRichText } from '../../service/rich-text';
import type { EmployeeReviewsResponse, ReviewResponse } from '../dto/review.response';

const money = (point: SalaryPoint | null) => (point ? toMoney(point.amount, point.currency) : null);

export const toReviewResponse = (review: ReviewRecord): ReviewResponse => ({
    id: review.id,
    kind: isReviewKind(review.kind) ? review.kind : ReviewKind.REGULAR,
    title: review.title,
    reviewedAt: isoDate(review.reviewedAt),
    status: isReviewStatus(review.status) ? review.status : ReviewStatus.SCHEDULED,
    salary: review.salaryAmount && review.salaryCurrency ? toMoney(review.salaryAmount, review.salaryCurrency) : null,
    responsibles: review.responsibles.map(({ responsible }) => ({
        id: responsible.id,
        firstName: responsible.firstName,
        lastName: responsible.lastName,
    })),
    feedback: {
        hr: readRichText(review.feedbackHr),
        teamLead: readRichText(review.feedbackLead),
        team: readRichText(review.feedbackTeam),
        client: readRichText(review.feedbackClient),
    },
    createdAt: review.createdAt.toISOString(),
    version: review.version,
});

export const toEmployeeReviewsResponse = (result: EmployeeReviews): EmployeeReviewsResponse => ({
    salary: {
        current: money(result.salary.current),
        previous: money(result.salary.previous),
        changePercent: result.salary.changePercent,
        history: result.salary.history.map((point) => ({
            reviewedAt: isoDate(point.reviewedAt),
            salary: toMoney(point.amount, point.currency),
        })),
    },
    content: result.reviews.map(toReviewResponse),
});
