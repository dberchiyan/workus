import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import { SubscriptionStatus } from '../service/subscription-status';
import {
    type BillingEventRecord,
    billingEventSelect,
    type OrganisationBillingRecord,
    organisationBillingSelect,
} from './record/billing.record';

export interface SubscriptionColumns {
    plan: string;
    subscriptionStatus: string;
    scheduledPlan: string | null;
    currentPeriodEnd: Date | null;
    pastDueSince: Date | null;
    billingSubscriptionId: string | null;
}

export interface NewBillingEventRow {
    providerEventId: string;
    type: string;
    occurredAt: Date;
    organisationId: string | null;
    subscriptionId: string | null;
    customerId: string | null;
}

/** The billing columns of organisations, and the stored webhook deliveries. */
@Injectable()
export class BillingRepository {
    constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>) {}

    findBilling(organisationId: string): Promise<OrganisationBillingRecord | null> {
        return this.txHost.tx.organisation.findUnique({
            where: { id: organisationId },
            select: organisationBillingSelect,
        });
    }

    async findPlan(organisationId: string): Promise<string | null> {
        const organisation = await this.txHost.tx.organisation.findUnique({
            where: { id: organisationId },
            select: { plan: true },
        });
        return organisation?.plan ?? null;
    }

    /** The company a provider subscription belongs to (the provider's id is unique). */
    async findIdBySubscriptionId(subscriptionId: string): Promise<string | null> {
        const organisation = await this.txHost.tx.organisation.findUnique({
            where: { billingSubscriptionId: subscriptionId },
            select: { id: true },
        });
        return organisation?.id ?? null;
    }

    async findIdByCustomerId(customerId: string): Promise<string | null> {
        const organisation = await this.txHost.tx.organisation.findUnique({
            where: { billingCustomerId: customerId },
            select: { id: true },
        });
        return organisation?.id ?? null;
    }

    /** Stores the provider's customer id once; false when another request stored one first. */
    async setCustomerId(organisationId: string, customerId: string): Promise<boolean> {
        const { count } = await this.txHost.tx.organisation.updateMany({
            where: { id: organisationId, billingCustomerId: null },
            data: { billingCustomerId: customerId },
        });
        return count > 0;
    }

    async updateSubscription(organisationId: string, columns: SubscriptionColumns): Promise<void> {
        await this.txHost.tx.organisation.update({
            where: { id: organisationId },
            data: columns,
            select: { id: true },
        });
    }

    /** Companies whose grace period ended before `limit` (oldest first, bounded per run). */
    findPastDueBefore(limit: Date, take: number): Promise<OrganisationBillingRecord[]> {
        return this.txHost.tx.organisation.findMany({
            where: {
                subscriptionStatus: SubscriptionStatus.PAST_DUE,
                pastDueSince: { lte: limit },
            },
            select: organisationBillingSelect,
            orderBy: [{ pastDueSince: 'asc' }, { id: 'asc' }],
            take,
        });
    }

    /** Companies with a subscription at the provider (reconciliation, bounded per run). */
    findWithSubscription(take: number): Promise<OrganisationBillingRecord[]> {
        return this.txHost.tx.organisation.findMany({
            where: { billingSubscriptionId: { not: null } },
            select: organisationBillingSelect,
            orderBy: { id: 'asc' },
            take,
        });
    }

    /** Stores a delivery; false when this provider event was stored before (a repeat). */
    async createEvent(row: NewBillingEventRow): Promise<boolean> {
        const { count } = await this.txHost.tx.billingEvent.createMany({
            data: row,
            skipDuplicates: true,
        });
        return count > 0;
    }

    findEventByProviderId(providerEventId: string): Promise<BillingEventRecord | null> {
        return this.txHost.tx.billingEvent.findUnique({
            where: { providerEventId },
            select: billingEventSelect,
        });
    }

    async markEventProcessed(
        id: string,
        outcome: { organisationId: string | null; error: string | null },
    ): Promise<void> {
        await this.txHost.tx.billingEvent.update({
            where: { id },
            data: {
                processedAt: new Date(),
                organisationId: outcome.organisationId,
                error: outcome.error,
            },
            select: { id: true },
        });
    }

    async deleteEventsBefore(limit: Date): Promise<number> {
        const { count } = await this.txHost.tx.billingEvent.deleteMany({
            where: { receivedAt: { lt: limit } },
        });
        return count;
    }
}
