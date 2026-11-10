import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../../common/persistence/prisma.service';
import {
  type DepartmentRecord,
  departmentSelect,
  type StructurePositionRecord,
  structurePositionSelect,
} from './record/company-structure.record';

/** Per organisation: enough for any real company, and every list here stays bounded. */
export const MAX_DEPARTMENTS = 50;
export const MAX_POSITIONS = 200;

/** Departments (`position_categories`) and positions of one organisation's structure. */
@Injectable()
export class CompanyStructureRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  findDepartments(organisationId: string): Promise<DepartmentRecord[]> {
    return this.txHost.tx.positionCategory.findMany({
      where: { organisationId },
      select: departmentSelect,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: MAX_DEPARTMENTS,
    });
  }

  findDepartment(organisationId: string, id: string): Promise<DepartmentRecord | null> {
    return this.txHost.tx.positionCategory.findUnique({
      where: { id, organisationId },
      select: departmentSelect,
    });
  }

  findPosition(organisationId: string, id: string): Promise<StructurePositionRecord | null> {
    return this.txHost.tx.position.findUnique({
      where: { id, organisationId },
      select: structurePositionSelect,
    });
  }

  countDepartments(organisationId: string): Promise<number> {
    return this.txHost.tx.positionCategory.count({ where: { organisationId } });
  }

  countPositions(organisationId: string): Promise<number> {
    return this.txHost.tx.position.count({ where: { organisationId } });
  }

  async departmentNameTaken(
    organisationId: string,
    name: string,
    exceptId?: string,
  ): Promise<boolean> {
    const count = await this.txHost.tx.positionCategory.count({
      where: {
        organisationId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
    return count > 0;
  }

  async positionTitleTaken(
    organisationId: string,
    title: string,
    exceptId?: string,
  ): Promise<boolean> {
    const count = await this.txHost.tx.position.count({
      where: {
        organisationId,
        title: { equals: title, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
    return count > 0;
  }

  /** People holding each position of the organisation, current and former (any employee row). */
  async countHoldersByPosition(organisationId: string): Promise<Map<string, number>> {
    const groups = await this.txHost.tx.employee.groupBy({
      by: ['positionId'],
      where: { organisationId },
      _count: { _all: true },
      orderBy: { positionId: 'asc' },
      take: MAX_POSITIONS,
    });
    return new Map(groups.map((group) => [group.positionId, group._count._all]));
  }

  async countHolders(organisationId: string, positionId: string): Promise<number> {
    return this.txHost.tx.employee.count({ where: { organisationId, positionId } });
  }

  async nextSortOrder(organisationId: string): Promise<number> {
    const last = await this.txHost.tx.positionCategory.aggregate({
      where: { organisationId },
      _max: { sortOrder: true },
    });
    return (last._max.sortOrder ?? -1) + 1;
  }

  createDepartment(
    organisationId: string,
    name: string,
    sortOrder: number,
    createdBy: string | null,
  ): Promise<DepartmentRecord> {
    return this.txHost.tx.positionCategory.create({
      data: { organisationId, name, sortOrder, createdBy, updatedBy: createdBy },
      select: departmentSelect,
    });
  }

  /** Optimistic lock: false when the version is stale or the department is gone. */
  async renameDepartment(
    organisationId: string,
    id: string,
    version: number,
    name: string,
    updatedBy: string,
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.positionCategory.updateMany({
      where: { id, organisationId, version },
      data: { name, updatedBy, version: { increment: 1 } },
    });
    return count > 0;
  }

  async deleteDepartment(organisationId: string, id: string): Promise<boolean> {
    const { count } = await this.txHost.tx.positionCategory.deleteMany({
      where: { id, organisationId },
    });
    return count > 0;
  }

  createPosition(
    organisationId: string,
    categoryId: string,
    title: string,
    createdBy: string | null,
  ): Promise<StructurePositionRecord> {
    return this.txHost.tx.position.create({
      data: { organisationId, categoryId, title, createdBy, updatedBy: createdBy },
      select: structurePositionSelect,
    });
  }

  /** Optimistic lock: false when the version is stale or the position is gone. */
  async renamePosition(
    organisationId: string,
    id: string,
    version: number,
    title: string,
    updatedBy: string,
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.position.updateMany({
      where: { id, organisationId, version },
      data: { title, updatedBy, version: { increment: 1 } },
    });
    return count > 0;
  }

  async deletePosition(organisationId: string, id: string): Promise<boolean> {
    const { count } = await this.txHost.tx.position.deleteMany({
      where: { id, organisationId },
    });
    return count > 0;
  }

  /** The default structure of a new company, in one statement per table. */
  async createMany(
    organisationId: string,
    departments: readonly { name: string; positions: readonly string[] }[],
    createdBy: string | null,
  ): Promise<void> {
    const created = await this.txHost.tx.positionCategory.createManyAndReturn({
      data: departments.map((department, sortOrder) => ({
        organisationId,
        name: department.name,
        sortOrder,
        createdBy,
        updatedBy: createdBy,
      })),
      select: { id: true, name: true },
    });
    const idByName = new Map(created.map((department) => [department.name, department.id]));
    await this.txHost.tx.position.createMany({
      data: departments.flatMap((department) => {
        const categoryId = idByName.get(department.name);
        return categoryId
          ? department.positions.map((title) => ({
              organisationId,
              categoryId,
              title,
              createdBy,
              updatedBy: createdBy,
            }))
          : [];
      }),
    });
  }
}
