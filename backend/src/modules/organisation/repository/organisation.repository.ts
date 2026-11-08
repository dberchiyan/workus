import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import { OrganisationStatus } from '../../user/service/organisation-status';
import { type OrganisationRecord, organisationSelect } from './record/organisation.record';

@Injectable()
export class OrganisationRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  /** A registered company waits for a platform admin's approval. */
  create(name: string): Promise<OrganisationRecord> {
    return this.txHost.tx.organisation.create({
      data: { name, status: OrganisationStatus.PENDING },
      select: organisationSelect,
    });
  }

  findById(id: string): Promise<OrganisationRecord | null> {
    return this.txHost.tx.organisation.findUnique({ where: { id }, select: organisationSelect });
  }

  /** Optimistic lock: false when the version is stale. */
  async rename(id: string, version: number, name: string, updatedBy: string): Promise<boolean> {
    const { count } = await this.txHost.tx.organisation.updateMany({
      where: { id, version },
      data: { name, updatedBy, version: { increment: 1 } },
    });
    return count > 0;
  }

  /**
   * Locks the organisation's row until the transaction ends. Role changes take it first, so two
   * owners demoting each other at once cannot both see "another owner is left" (write skew).
   */
  async lock(id: string): Promise<void> {
    await this.txHost.tx.$queryRaw`SELECT 1 FROM organisations WHERE id = ${id}::uuid FOR UPDATE`;
  }
}
