import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import type { Decimal } from '../../../../common/persistence/money';
import type { PrismaService } from '../../../../common/persistence/prisma.service';
import { Prisma } from '../../../../generated/prisma/client';
import { ReviewKind } from '../service/review-kind';
import { ReviewStatus } from '../service/review-status';
import type { RichTextDoc } from '../service/rich-text';
import {
    type DashboardReviewRecord,
    dashboardReviewSelect,
    MAX_REVIEWS,
    type ReviewRecord,
    reviewSelect,
} from './record/review.record';

export type ReviewChanges = Omit<NewReview, 'organisationId' | 'employeeId' | 'kind' | 'createdBy'> & {
    updatedBy: string;
};

export interface NewReview {
    organisationId: string;
    employeeId: string;
    kind: string;
    title: string;
    reviewedAt: Date;
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
    constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>) {}

    /** Newest first. */
    findByEmployee(organisationId: string, employeeId: string): Promise<ReviewRecord[]> {
        return this.txHost.tx.employeeReview.findMany({
            where: { organisationId, employeeId },
            select: reviewSelect,
            orderBy: [{ reviewedAt: 'desc' }, { id: 'desc' }],
            take: MAX_REVIEWS,
        });
    }

    async create(review: NewReview): Promise<ReviewRecord> {
        return this.txHost.tx.employeeReview.create({
            data: {
                organisationId: review.organisationId,
                employeeId: review.employeeId,
                kind: review.kind,
                title: review.title,
                reviewedAt: review.reviewedAt,
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

    findById(organisationId: string, reviewId: string): Promise<ReviewRecord | null> {
        return this.txHost.tx.employeeReview.findUnique({
            where: { id: reviewId, organisationId },
            select: reviewSelect,
        });
    }

    /** Optimistic lock: updates only if `version` still matches; false → someone changed it first. */
    async update(organisationId: string, reviewId: string, version: number, changes: ReviewChanges): Promise<boolean> {
        const { count } = await this.txHost.tx.employeeReview.updateMany({
            where: { id: reviewId, organisationId, version },
            data: {
                title: changes.title,
                reviewedAt: changes.reviewedAt,
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
        await this.txHost.tx.employeeReviewResponsible.deleteMany({
            where: { organisationId, reviewId },
        });
        await this.txHost.tx.employeeReviewResponsible.createMany({
            data: changes.responsibleUserIds.map((responsibleUserId) => ({
                organisationId,
                reviewId,
                responsibleUserId,
                createdBy: changes.updatedBy,
            })),
        });
        return true;
    }

    async delete(organisationId: string, reviewId: string): Promise<void> {
        await this.txHost.tx.employeeReview.deleteMany({ where: { id: reviewId, organisationId } });
    }

    findStarting(
        organisationId: string,
        employeeId: string,
    ): Promise<{ id: string; title: string; reviewedAt: Date } | null> {
        return this.txHost.tx.employeeReview.findFirst({
            where: { organisationId, employeeId, kind: ReviewKind.STARTING },
            select: { id: true, title: true, reviewedAt: true },
        });
    }

    /** Any other review dated before `reviewedAt`? */
    async existsRegularBefore(organisationId: string, employeeId: string, reviewedAt: Date): Promise<boolean> {
        return (
            (await this.txHost.tx.employeeReview.count({
                where: {
                    organisationId,
                    employeeId,
                    kind: { not: ReviewKind.STARTING },
                    reviewedAt: { lt: reviewedAt },
                },
            })) > 0
        );
    }

    async moveDate(organisationId: string, reviewId: string, reviewedAt: Date, updatedBy: string): Promise<void> {
        await this.txHost.tx.employeeReview.update({
            where: { id: reviewId, organisationId },
            data: { reviewedAt, updatedBy, version: { increment: 1 } },
            select: { id: true },
        });
    }

    /** Scheduled reviews dated after `reviewedAt` (bounded like every list). */
    findScheduledAfter(
        organisationId: string,
        employeeId: string,
        reviewedAt: Date,
    ): Promise<{ id: string; title: string }[]> {
        return this.txHost.tx.employeeReview.findMany({
            where: {
                organisationId,
                employeeId,
                status: ReviewStatus.SCHEDULED,
                reviewedAt: { gt: reviewedAt },
            },
            select: { id: true, title: true },
            orderBy: { reviewedAt: 'asc' },
            take: MAX_REVIEWS,
        });
    }

    async cancelMany(organisationId: string, reviewIds: string[], updatedBy: string): Promise<void> {
        await this.txHost.tx.employeeReview.updateMany({
            where: { organisationId, id: { in: reviewIds }, status: ReviewStatus.SCHEDULED },
            data: { status: ReviewStatus.CANCELED, updatedBy, version: { increment: 1 } },
        });
    }

    /** Scheduled reviews dated in [from, to]. */
    countScheduledBetween(organisationId: string, from: Date, to: Date): Promise<number> {
        return this.txHost.tx.employeeReview.count({
            where: { organisationId, status: ReviewStatus.SCHEDULED, reviewedAt: { gte: from, lte: to } },
        });
    }

    /** Scheduled reviews whose reviewedAt has passed (never completed or canceled). */
    countScheduledBefore(organisationId: string, reviewedAt: Date): Promise<number> {
        return this.txHost.tx.employeeReview.count({
            where: { organisationId, status: ReviewStatus.SCHEDULED, reviewedAt: { lt: reviewedAt } },
        });
    }

    /** Scheduled and completed regular reviews dated in [from, to], by reviewedAt then name, a page at a time. */
    async findScheduledOrCompletedBetween(
        organisationId: string,
        from: Date,
        to: Date,
        page: { offset: number; limit: number },
    ): Promise<{ content: DashboardReviewRecord[]; totalElements: number }> {
        const where: Prisma.EmployeeReviewWhereInput = {
            organisationId,
            kind: ReviewKind.REGULAR,
            status: { in: [ReviewStatus.SCHEDULED, ReviewStatus.COMPLETED] },
            reviewedAt: { gte: from, lte: to },
        };
        const [totalElements, content] = await Promise.all([
            this.txHost.tx.employeeReview.count({ where }),
            this.txHost.tx.employeeReview.findMany({
                where,
                select: dashboardReviewSelect,
                orderBy: [{ reviewedAt: 'asc' }, { employee: { user: { firstName: 'asc' } } }, { id: 'asc' }],
                skip: page.offset,
                take: page.limit,
            }),
        ]);
        return { content, totalElements };
    }

    /** Each employee's latest completed salary on or before `asOf` (bounded). */
    findLatestSalaries(
        organisationId: string,
        asOf: Date,
        limit: number,
    ): Promise<{ employeeId: string; salaryAmount: Decimal | null; salaryCurrency: string | null }[]> {
        return this.txHost.tx.employeeReview.findMany({
            where: {
                organisationId,
                status: ReviewStatus.COMPLETED,
                reviewedAt: { lte: asOf },
                salaryAmount: { not: null },
            },
            select: { employeeId: true, salaryAmount: true, salaryCurrency: true },
            distinct: ['employeeId'],
            orderBy: [{ employeeId: 'asc' }, { reviewedAt: 'desc' }, { createdAt: 'desc' }],
            take: limit,
        });
    }
}
