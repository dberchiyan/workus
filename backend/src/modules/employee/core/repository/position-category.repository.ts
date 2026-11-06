import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../../common/persistence/prisma.service';
import {
  type PositionCategoryRecord,
  positionCategorySelect,
} from './record/position-category.record';

/** A handful of categories by nature; bounded defensively. */
const MAX_CATEGORIES = 50;

@Injectable()
export class PositionCategoryRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  findAllOrdered(): Promise<PositionCategoryRecord[]> {
    return this.txHost.tx.positionCategory.findMany({
      select: positionCategorySelect,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: MAX_CATEGORIES,
    });
  }
}
