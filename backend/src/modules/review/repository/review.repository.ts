import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { Decimal } from '../../../common/persistence/money';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import type { RichTextDoc } from '../service/rich-text';
import { MAX_REVIEWS, type ReviewRecord, reviewSelect } from './record/review.record';

export type ReviewChanges = Omit<NewReview, 'employeeId' | 'createdBy'> & { updatedBy: string };

export interface NewReview {
  employeeId: string;
  title: string;
  reviewDate: Date;
  status: string;
  salaryAmount: Decimal | null;
  salaryCurrency: string | null;
  feedbackHr: RichTextDoc | null;
  feedbackLead: RichTextDoc | null;
  feedbackTeam: RichTextDoc | null;
  feedbackClient: RichTextDoc | null;
  responsibleUserIds: string[];
  createdBy: string;
}

/** jsonb: a document, or SQL NULL (Prisma.DbNull) when there is no feedback. */
const json = (doc: RichTextDoc | null): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  doc === null ? Prisma.DbNull : (doc as unknown as Prisma.InputJsonValue);

@Injectable()
export class ReviewRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  /** Newest first. */
  findByEmployee(employeeId: string): Promise<ReviewRecord[]> {
    return this.txHost.tx.employeeReview.findMany({
      where: { employeeId },
      select: reviewSelect,
      orderBy: [{ reviewDate: 'desc' }, { id: 'desc' }],
      take: MAX_REVIEWS,
    });
  }

  async create(review: NewReview): Promise<ReviewRecord> {
    return this.txHost.tx.employeeReview.create({
      data: {
        employeeId: review.employeeId,
        title: review.title,
        reviewDate: review.reviewDate,
        status: review.status,
        salaryAmount: review.salaryAmount,
        salaryCurrency: review.salaryCurrency,
        feedbackHr: json(review.feedbackHr),
        feedbackLead: json(review.feedbackLead),
        feedbackTeam: json(review.feedbackTeam),
        feedbackClient: json(review.feedbackClient),
        createdBy: review.createdBy,
        updatedBy: review.createdBy,
        responsibles: {
          create: review.responsibleUserIds.map((responsibleUserId) => ({
            responsibleUserId,
            createdBy: review.createdBy,
          })),
        },
      },
      select: reviewSelect,
    });
  }

  findById(reviewId: string): Promise<ReviewRecord | null> {
    return this.txHost.tx.employeeReview.findUnique({
      where: { id: reviewId },
      select: reviewSelect,
    });
  }

  /** Optimistic lock: updates only if `version` still matches; false → someone changed it first. */
  async update(reviewId: string, version: number, changes: ReviewChanges): Promise<boolean> {
    const { count } = await this.txHost.tx.employeeReview.updateMany({
      where: { id: reviewId, version },
      data: {
        title: changes.title,
        reviewDate: changes.reviewDate,
        status: changes.status,
        salaryAmount: changes.salaryAmount,
        salaryCurrency: changes.salaryCurrency,
        feedbackHr: json(changes.feedbackHr),
        feedbackLead: json(changes.feedbackLead),
        feedbackTeam: json(changes.feedbackTeam),
        feedbackClient: json(changes.feedbackClient),
        updatedBy: changes.updatedBy,
        version: { increment: 1 },
      },
    });
    if (count === 0) {
      return false;
    }
    // Responsibles are replaced as a set.
    await this.txHost.tx.employeeReviewResponsible.deleteMany({ where: { reviewId } });
    await this.txHost.tx.employeeReviewResponsible.createMany({
      data: changes.responsibleUserIds.map((responsibleUserId) => ({
        reviewId,
        responsibleUserId,
        createdBy: changes.updatedBy,
      })),
    });
    return true;
  }

  async delete(reviewId: string): Promise<void> {
    await this.txHost.tx.employeeReview.deleteMany({ where: { id: reviewId } });
  }
}
