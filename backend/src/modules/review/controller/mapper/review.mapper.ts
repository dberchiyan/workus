import { toMoney } from '../../../../common/persistence/money';
import type { ReviewRecord } from '../../repository/record/review.record';
import { isReviewStatus, ReviewStatus } from '../../service/review-status';
import { readRichText } from '../../service/rich-text';
import type { EmployeeReviews, SalaryPoint } from '../../service/review.types';
import type { EmployeeReviewsResponse, ReviewResponse } from '../dto/review.response';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const money = (point: SalaryPoint | null) => (point ? toMoney(point.amount, point.currency) : null);

export const toReviewResponse = (review: ReviewRecord): ReviewResponse => ({
  id: review.id,
  title: review.title,
  date: isoDate(review.reviewDate),
  // Guarded by ck_employee_reviews_status.
  status: isReviewStatus(review.status) ? review.status : ReviewStatus.SCHEDULED,
  salary:
    review.salaryAmount && review.salaryCurrency
      ? toMoney(review.salaryAmount, review.salaryCurrency)
      : null,
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
      date: isoDate(point.date),
      salary: toMoney(point.amount, point.currency),
    })),
  },
  content: result.reviews.map(toReviewResponse),
});
