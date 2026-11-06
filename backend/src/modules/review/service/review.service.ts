import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  BusinessRuleException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../common/exception/api.exception';
import { Currency, percentChange, toDecimal } from '../../../common/persistence/money';
import { EmployeeService } from '../../employee/service/employee.service';
import type { ReviewRecord } from '../repository/record/review.record';
import { ReviewRepository } from '../repository/review.repository';
import { ReviewStatus } from './review-status';
import { isEmptyRichText, type RichTextDoc } from './rich-text';
import type {
  CreateReviewCommand,
  EmployeeReviews,
  SalaryOverview,
  SalaryPoint,
  UpdateReviewCommand,
} from './review.types';

/** Salary history = completed reviews with a salary, oldest first. */
const salaryOverview = (reviews: ReviewRecord[]): SalaryOverview => {
  const history: SalaryPoint[] = reviews
    .filter((review) => review.status === ReviewStatus.COMPLETED)
    .flatMap((review) =>
      review.salaryAmount && review.salaryCurrency
        ? [
            {
              date: review.reviewDate,
              amount: review.salaryAmount,
              currency: review.salaryCurrency,
            },
          ]
        : [],
    )
    .reverse();
  const current = history.at(-1) ?? null;
  const previous = history.at(-2) ?? null;
  const isComparable =
    current && previous && current.currency === previous.currency && !previous.amount.isZero();
  return {
    current,
    previous,
    changePercent: isComparable ? percentChange(current.amount, previous.amount) : null,
    history,
  };
};

/** Absent, null or text-less → no feedback. */
const optionalDoc = (doc: RichTextDoc | null | undefined): RichTextDoc | null =>
  doc && !isEmptyRichText(doc) ? doc : null;

/** Command → stored columns (explicit mapping, never the DTO itself). */
const toColumns = (command: CreateReviewCommand) => ({
  title: command.title,
  reviewDate: new Date(`${command.date}T00:00:00Z`),
  status: command.status,
  salaryAmount: command.salary ? toDecimal(command.salary) : null,
  salaryCurrency: command.salary ? Currency.USD : null,
  feedbackHr: optionalDoc(command.feedback.hr),
  feedbackLead: optionalDoc(command.feedback.teamLead),
  feedbackTeam: optionalDoc(command.feedback.team),
  feedbackClient: optionalDoc(command.feedback.client),
});

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly employeeService: EmployeeService,
  ) {}

  async findForEmployee(employeeId: string): Promise<EmployeeReviews> {
    await this.requireEmployee(employeeId);
    const reviews = await this.reviewRepository.findByEmployee(employeeId);
    return { reviews, salary: salaryOverview(reviews) };
  }

  /** The policy has already checked that the review belongs to the employee in the path. */
  async findOne(reviewId: string): Promise<ReviewRecord> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new ResourceNotFoundException();
    }
    return review;
  }

  @Transactional()
  async create(
    employeeId: string,
    command: CreateReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    await this.requireEmployee(employeeId);
    const responsibleUserIds = await this.checkedResponsibles(command.responsibleUserIds);
    return this.reviewRepository.create({
      employeeId,
      ...toColumns(command),
      responsibleUserIds,
      createdBy: actorId,
    });
  }

  @Transactional()
  async update(
    reviewId: string,
    command: UpdateReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    const responsibleUserIds = await this.checkedResponsibles(command.responsibleUserIds);
    const isUpdated = await this.reviewRepository.update(reviewId, command.version, {
      ...toColumns(command),
      responsibleUserIds,
      updatedBy: actorId,
    });
    if (!isUpdated) {
      throw new ConcurrentModificationException();
    }
    return this.findOne(reviewId);
  }

  @Transactional()
  async delete(reviewId: string): Promise<void> {
    await this.reviewRepository.delete(reviewId);
  }

  private async checkedResponsibles(userIds: string[]): Promise<string[]> {
    const unique = [...new Set(userIds)];
    if (!(await this.employeeService.areResponsibleCandidates(unique))) {
      throw new BusinessRuleException(
        'errors.review.responsibleNotFound',
        {},
        'responsibleUserIds',
      );
    }
    return unique;
  }

  private async requireEmployee(employeeId: string): Promise<void> {
    if (!(await this.employeeService.exists(employeeId))) {
      throw new ResourceNotFoundException();
    }
  }
}
