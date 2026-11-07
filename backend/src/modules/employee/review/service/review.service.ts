import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  BusinessRuleException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../../common/exception/api.exception';
import {
  Currency,
  type Decimal,
  percentChange,
  toDecimal,
} from '../../../../common/persistence/money';
import { AuditAction, AuditTargetType } from '../../../audit/service/audit-action';
import { AuditField, auditValue, changeOf } from '../../../audit/service/audit-change';
import { AuditService } from '../../../audit/service/audit.service';
import { EmployeeService } from '../../core/service/employee.service';
import type { ReviewRecord } from '../repository/record/review.record';
import type { DashboardReviews } from './review.types';
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

/** One salary per employee; a company of this size never comes close. */
const MAX_SALARIES = 5000;

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly employeeService: EmployeeService,
    private readonly auditService: AuditService,
  ) {}

  async findForEmployee(organisationId: string, employeeId: string): Promise<EmployeeReviews> {
    await this.requireEmployee(organisationId, employeeId);
    const reviews = await this.reviewRepository.findByEmployee(organisationId, employeeId);
    return { reviews, salary: salaryOverview(reviews) };
  }

  /** For other modules (dashboard): scheduled reviews in the next `days` and overdue ones. */
  async dueSummary(
    organisationId: string,
    today: Date,
    days: number,
  ): Promise<{ upcoming: number; overdue: number }> {
    const until = new Date(today.getTime() + days * 86_400_000);
    const [upcoming, overdue] = await Promise.all([
      this.reviewRepository.countScheduledBetween(organisationId, today, until),
      this.reviewRepository.countScheduledBefore(organisationId, today),
    ]);
    return { upcoming, overdue };
  }

  /** For other modules (insights): each employee's salary as of `asOf` (latest completed review). */
  async salariesAsOf(
    organisationId: string,
    asOf: Date,
  ): Promise<{ employeeId: string; amount: Decimal; currency: string }[]> {
    const rows = await this.reviewRepository.findLatestSalaries(organisationId, asOf, MAX_SALARIES);
    return rows.flatMap((row) =>
      row.salaryAmount && row.salaryCurrency
        ? [{ employeeId: row.employeeId, amount: row.salaryAmount, currency: row.salaryCurrency }]
        : [],
    );
  }

  /** For other modules (dashboard): scheduled and completed regular reviews in [from, to]. */
  async reviewsBetween(
    organisationId: string,
    from: Date,
    to: Date,
    pageRequest: { page: number; size: number },
  ): Promise<DashboardReviews> {
    const page = await this.reviewRepository.findScheduledOrCompletedBetween(
      organisationId,
      from,
      to,
      {
        offset: pageRequest.page * pageRequest.size,
        limit: pageRequest.size,
      },
    );
    return {
      content: page.content.map((review) => ({
        id: review.id,
        title: review.title,
        reviewDate: review.reviewDate,
        status: review.status,
        employee: {
          id: review.employee.id,
          userId: review.employee.user.id,
          firstName: review.employee.user.firstName,
          lastName: review.employee.user.lastName,
          positionTitle: review.employee.position.title,
        },
      })),
      totalElements: page.totalElements,
    };
  }

  /** The policy has already checked that the review belongs to the employee in the path. */
  async findOne(organisationId: string, reviewId: string): Promise<ReviewRecord> {
    const review = await this.reviewRepository.findById(organisationId, reviewId);
    if (!review) {
      throw new ResourceNotFoundException();
    }
    return review;
  }

  @Transactional()
  async create(
    organisationId: string,
    employeeId: string,
    command: CreateReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    await this.requireEmployee(organisationId, employeeId);
    return this.insert(organisationId, employeeId, ReviewKind.REGULAR, command, actorId);
  }

  /**
   * For other modules (employment): the employee's salary at hire, as a completed review dated the
   * start date. Part of the caller's transaction.
   */
  @Transactional()
  async createStarting(
    organisationId: string,
    employeeId: string,
    command: StartingReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    await this.requireEmployee(organisationId, employeeId);
    return this.insert(
      organisationId,
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

  /**
   * For other modules (employment): the start date changed — the starting salary moves with it.
   * Refused when another review is dated before the new start date. Part of the caller's
   * transaction.
   */
  @Transactional()
  async moveStarting(
    organisationId: string,
    employeeId: string,
    startDate: string,
    actorId: string,
  ): Promise<void> {
    const date = new Date(`${startDate}T00:00:00Z`);
    if (await this.reviewRepository.existsRegularBefore(organisationId, employeeId, date)) {
      throw new BusinessRuleException('errors.review.reviewsBeforeStart', {}, 'startDate');
    }
    const starting = await this.reviewRepository.findStarting(organisationId, employeeId);
    if (!starting || starting.reviewDate.getTime() === date.getTime()) {
      return;
    }
    await this.reviewRepository.moveDate(organisationId, starting.id, date, actorId);
    await this.auditService.record({
      action: AuditAction.REVIEW_UPDATED,
      employeeId,
      target: { type: AuditTargetType.REVIEW, id: starting.id, label: starting.title },
      changes: changeOf(
        AuditField.DATE,
        auditValue.date(starting.reviewDate),
        auditValue.date(date),
      ),
    });
  }

  /**
   * For other modules (employment): the employee leaves on `date` — reviews still scheduled after
   * it are canceled (each recorded). Part of the caller's transaction. Returns how many.
   */
  @Transactional()
  async cancelScheduledAfter(
    organisationId: string,
    employeeId: string,
    date: string,
    actorId: string,
  ): Promise<number> {
    const reviews = await this.reviewRepository.findScheduledAfter(
      organisationId,
      employeeId,
      new Date(`${date}T00:00:00Z`),
    );
    if (reviews.length === 0) {
      return 0;
    }
    await this.reviewRepository.cancelMany(
      organisationId,
      reviews.map((review) => review.id),
      actorId,
    );
    await this.auditService.recordMany(
      reviews.map((review) => ({
        action: AuditAction.REVIEW_UPDATED,
        employeeId,
        target: { type: AuditTargetType.REVIEW, id: review.id, label: review.title },
        changes: changeOf(
          AuditField.STATUS,
          auditValue.reviewStatus(ReviewStatus.SCHEDULED),
          auditValue.reviewStatus(ReviewStatus.CANCELED),
        ),
      })),
    );
    return reviews.length;
  }

  private async insert(
    organisationId: string,
    employeeId: string,
    kind: ReviewKind,
    command: CreateReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    const responsibleUserIds = await this.checkedResponsibles(
      organisationId,
      command.responsibleUserIds,
    );
    const review = await this.reviewRepository.create({
      organisationId,
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
    organisationId: string,
    employeeId: string,
    reviewId: string,
    command: UpdateReviewCommand,
    actorId: string,
  ): Promise<ReviewRecord> {
    const before = await this.findOne(organisationId, reviewId);
    if (before.kind === ReviewKind.STARTING) {
      lockStarting(before, command);
    }
    const responsibleUserIds = await this.checkedResponsibles(
      organisationId,
      command.responsibleUserIds,
    );
    const isUpdated = await this.reviewRepository.update(
      organisationId,
      reviewId,
      command.version,
      {
        ...toColumns(command),
        responsibleUserIds,
        updatedBy: actorId,
      },
    );
    if (!isUpdated) {
      throw new ConcurrentModificationException();
    }
    const after = await this.findOne(organisationId, reviewId);
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
  async delete(organisationId: string, employeeId: string, reviewId: string): Promise<void> {
    const review = await this.findOne(organisationId, reviewId);
    if (review.kind === ReviewKind.STARTING) {
      // The salary history starts here; edit it instead.
      throw new BusinessRuleException('errors.review.startingNotDeletable');
    }
    await this.reviewRepository.delete(organisationId, reviewId);
    await this.auditService.record({
      action: AuditAction.REVIEW_DELETED,
      employeeId,
      target: { type: AuditTargetType.REVIEW, id: reviewId, label: review.title },
      changes: reviewDeletedChanges(review),
    });
  }

  private async checkedResponsibles(organisationId: string, userIds: string[]): Promise<string[]> {
    const unique = [...new Set(userIds)];
    if (!(await this.employeeService.areResponsibleCandidates(organisationId, unique))) {
      throw new BusinessRuleException(
        'errors.review.responsibleNotFound',
        {},
        'responsibleUserIds',
      );
    }
    return unique;
  }

  private async requireEmployee(organisationId: string, employeeId: string): Promise<void> {
    if (!(await this.employeeService.exists(organisationId, employeeId))) {
      throw new ResourceNotFoundException();
    }
  }
}
