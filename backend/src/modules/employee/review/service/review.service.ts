import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  BusinessRuleException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../../common/exception/api.exception';
import { Currency, percentChange, toDecimal } from '../../../../common/persistence/money';
import { AuditAction, AuditTargetType } from '../../../audit/service/audit-action';
import { AuditService } from '../../../audit/service/audit.service';
import { EmployeeService } from '../../core/service/employee.service';
import type { ReviewRecord } from '../repository/record/review.record';
import { ReviewRepository } from '../repository/review.repository';
import { reviewCreatedChanges, reviewDeletedChanges, reviewUpdatedChanges } from './review-audit';
import { ReviewKind, STARTING_REVIEW_TITLE } from './review-kind';
import { ReviewStatus } from './review-status';
import { isEmptyRichText, type RichTextDoc } from './rich-text';
import type {
  CreateReviewCommand,
  EmployeeReviews,
  SalaryOverview,
  SalaryPoint,
  StartingReviewCommand,
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

/** A starting review keeps the start date and stays completed; salary and the rest are editable. */
const lockStarting = (review: ReviewRecord, command: UpdateReviewCommand): void => {
  if (command.date !== review.reviewDate.toISOString().slice(0, 10)) {
    throw new BusinessRuleException('errors.review.startingDateLocked', {}, 'date');
  }
  if (command.status !== ReviewStatus.COMPLETED) {
    throw new BusinessRuleException('errors.review.startingStatusLocked', {}, 'status');
  }
};

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly employeeService: EmployeeService,
    private readonly auditService: AuditService,
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
    return this.insert(employeeId, ReviewKind.REGULAR, command, actorId);
  }

  /**
   * For other modules (hiring): the employee's salary at hire, as a completed review dated the
   * start date. Part of the caller's transaction.
   */
  @Transactional()
  async createStarting(
    employeeId: string,
    command: StartingReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    await this.requireEmployee(employeeId);
    return this.insert(
      employeeId,
      ReviewKind.STARTING,
      {
        title: STARTING_REVIEW_TITLE,
        date: command.startDate,
        status: ReviewStatus.COMPLETED,
        salary: command.salary,
        responsibleUserIds: command.responsibleUserIds,
        feedback: {},
      },
      actorId,
    );
  }

  private async insert(
    employeeId: string,
    kind: ReviewKind,
    command: CreateReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    const responsibleUserIds = await this.checkedResponsibles(command.responsibleUserIds);
    const review = await this.reviewRepository.create({
      employeeId,
      kind,
      ...toColumns(command),
      responsibleUserIds,
      createdBy: actorId,
    });
    await this.auditService.record({
      action: AuditAction.REVIEW_CREATED,
      employeeId,
      target: { type: AuditTargetType.REVIEW, id: review.id, label: review.title },
      changes: reviewCreatedChanges(review),
    });
    return review;
  }

  @Transactional()
  async update(
    employeeId: string,
    reviewId: string,
    command: UpdateReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    const before = await this.findOne(reviewId);
    if (before.kind === ReviewKind.STARTING) {
      lockStarting(before, command);
    }
    const responsibleUserIds = await this.checkedResponsibles(command.responsibleUserIds);
    const isUpdated = await this.reviewRepository.update(reviewId, command.version, {
      ...toColumns(command),
      responsibleUserIds,
      updatedBy: actorId,
    });
    if (!isUpdated) {
      throw new ConcurrentModificationException();
    }
    const after = await this.findOne(reviewId);
    const changes = reviewUpdatedChanges(before, after);
    // A save without edits changes nothing worth a history entry.
    if (changes.length > 0) {
      await this.auditService.record({
        action: AuditAction.REVIEW_UPDATED,
        employeeId,
        target: { type: AuditTargetType.REVIEW, id: reviewId, label: after.title },
        changes,
      });
    }
    return after;
  }

  @Transactional()
  async delete(employeeId: string, reviewId: string): Promise<void> {
    const review = await this.findOne(reviewId);
    if (review.kind === ReviewKind.STARTING) {
      // The salary history starts here; edit it instead.
      throw new BusinessRuleException('errors.review.startingNotDeletable');
    }
    await this.reviewRepository.delete(reviewId);
    await this.auditService.record({
      action: AuditAction.REVIEW_DELETED,
      employeeId,
      target: { type: AuditTargetType.REVIEW, id: reviewId, label: review.title },
      changes: reviewDeletedChanges(review),
    });
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
