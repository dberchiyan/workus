import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../../common/dto/pageable';
import {
  BusinessConflictException,
  BusinessRuleException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../../common/exception/api.exception';
import { AuditAction, AuditTargetType } from '../../../audit/service/audit-action';
import { AuditField, auditValue, changeOf } from '../../../audit/service/audit-change';
import { AuditService } from '../../../audit/service/audit.service';
import {
  CompanyStructureRepository,
  MAX_DEPARTMENTS,
  MAX_POSITIONS,
} from '../repository/company-structure.repository';
import { EmployeeRepository } from '../repository/employee.repository';
import type {
  DepartmentRecord,
  StructurePositionRecord,
} from '../repository/record/company-structure.record';
import { todayUtc } from './calendar-date';
import { DEFAULT_STRUCTURE } from './default-structure';
import type { EmployeeSortField } from './employee-sort';
import { EmployeeStatus } from './employee-status';
import type { EmployeePage } from './employee.types';

export interface StructurePosition extends StructurePositionRecord {
  employeeCount: number;
  removable: boolean;
}

export interface Department extends Omit<DepartmentRecord, 'positions'> {
  positions: StructurePosition[];
}

/**
 * The organisation's own structure (Settings → Company structure): departments, each with its
 * positions. Names are unique in the organisation (any case). Only what nobody holds is removed:
 * a position with no employee row (current or former), a department with no positions. Every
 * change is audited (department.*, position.*).
 */
@Injectable()
export class CompanyStructureService {
  constructor(
    private readonly structureRepository: CompanyStructureRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organisationId: string): Promise<Department[]> {
    const [departments, activeByPosition, holdersByPosition] = await Promise.all([
      this.structureRepository.findDepartments(organisationId),
      this.employeeRepository.countByPosition(organisationId, {
        searchTerms: [],
        status: EmployeeStatus.ACTIVE,
        today: todayUtc(),
      }),
      this.structureRepository.countHoldersByPosition(organisationId),
    ]);
    return departments.map((department) => ({
      ...department,
      positions: department.positions.map((position) => ({
        ...position,
        employeeCount: activeByPosition.get(position.id) ?? 0,
        removable: !holdersByPosition.has(position.id),
      })),
    }));
  }

  /** Who holds the position today (active employees), a page at a time. */
  async findHolders(
    organisationId: string,
    positionId: string,
    pageable: Pageable<EmployeeSortField>,
  ): Promise<EmployeePage> {
    const today = todayUtc();
    const page = await this.employeeRepository.findPage(
      organisationId,
      {
        searchTerms: [],
        status: EmployeeStatus.ACTIVE,
        categoryId: undefined,
        positionId,
        today,
      },
      pageable,
    );
    return { ...page, today };
  }

  /** A new company's starting structure (registration — joins its transaction). */
  async createDefault(organisationId: string, actorId: string): Promise<void> {
    await this.structureRepository.createMany(organisationId, DEFAULT_STRUCTURE, actorId);
  }

  @Transactional()
  async createDepartment(
    organisationId: string,
    name: string,
    actorId: string,
  ): Promise<Department> {
    if ((await this.structureRepository.countDepartments(organisationId)) >= MAX_DEPARTMENTS) {
      throw new BusinessRuleException(
        'errors.structure.tooManyDepartments',
        { max: MAX_DEPARTMENTS },
        'name',
      );
    }
    await this.requireFreeDepartmentName(organisationId, name);
    const department = await this.structureRepository.createDepartment(
      organisationId,
      name,
      await this.structureRepository.nextSortOrder(organisationId),
      actorId,
    );
    await this.auditService.record({
      action: AuditAction.DEPARTMENT_CREATED,
      employeeId: null,
      target: { type: AuditTargetType.DEPARTMENT, id: department.id, label: department.name },
      changes: changeOf(AuditField.NAME, null, auditValue.text(department.name)),
    });
    return { ...department, positions: [] };
  }

  @Transactional()
  async renameDepartment(
    organisationId: string,
    id: string,
    input: { name: string; version: number },
    actorId: string,
  ): Promise<void> {
    const before = await this.requireDepartment(organisationId, id);
    if (before.name === input.name) {
      return;
    }
    await this.requireFreeDepartmentName(organisationId, input.name, id);
    if (
      !(await this.structureRepository.renameDepartment(
        organisationId,
        id,
        input.version,
        input.name,
        actorId,
      ))
    ) {
      throw new ConcurrentModificationException();
    }
    await this.auditService.record({
      action: AuditAction.DEPARTMENT_UPDATED,
      employeeId: null,
      target: { type: AuditTargetType.DEPARTMENT, id, label: input.name },
      changes: changeOf(AuditField.NAME, auditValue.text(before.name), auditValue.text(input.name)),
    });
  }

  @Transactional()
  async removeDepartment(organisationId: string, id: string): Promise<void> {
    const department = await this.requireDepartment(organisationId, id);
    if (department.positions.length > 0) {
      throw new BusinessRuleException('errors.structure.departmentNotEmpty');
    }
    if (!(await this.structureRepository.deleteDepartment(organisationId, id))) {
      throw new ResourceNotFoundException();
    }
    await this.auditService.record({
      action: AuditAction.DEPARTMENT_DELETED,
      employeeId: null,
      target: { type: AuditTargetType.DEPARTMENT, id, label: department.name },
      changes: changeOf(AuditField.NAME, auditValue.text(department.name), null),
    });
  }

  @Transactional()
  async createPosition(
    organisationId: string,
    departmentId: string,
    title: string,
    actorId: string,
  ): Promise<StructurePosition> {
    await this.requireDepartment(organisationId, departmentId);
    if ((await this.structureRepository.countPositions(organisationId)) >= MAX_POSITIONS) {
      throw new BusinessRuleException(
        'errors.structure.tooManyPositions',
        { max: MAX_POSITIONS },
        'title',
      );
    }
    await this.requireFreePositionTitle(organisationId, title);
    const position = await this.structureRepository.createPosition(
      organisationId,
      departmentId,
      title,
      actorId,
    );
    await this.auditService.record({
      action: AuditAction.POSITION_CREATED,
      employeeId: null,
      target: { type: AuditTargetType.POSITION, id: position.id, label: position.title },
      changes: changeOf(AuditField.TITLE, null, auditValue.text(position.title)),
    });
    return { ...position, employeeCount: 0, removable: true };
  }

  @Transactional()
  async renamePosition(
    organisationId: string,
    id: string,
    input: { title: string; version: number },
    actorId: string,
  ): Promise<void> {
    const before = await this.requirePosition(organisationId, id);
    if (before.title === input.title) {
      return;
    }
    await this.requireFreePositionTitle(organisationId, input.title, id);
    if (
      !(await this.structureRepository.renamePosition(
        organisationId,
        id,
        input.version,
        input.title,
        actorId,
      ))
    ) {
      throw new ConcurrentModificationException();
    }
    await this.auditService.record({
      action: AuditAction.POSITION_UPDATED,
      employeeId: null,
      target: { type: AuditTargetType.POSITION, id, label: input.title },
      changes: changeOf(
        AuditField.TITLE,
        auditValue.text(before.title),
        auditValue.text(input.title),
      ),
    });
  }

  @Transactional()
  async removePosition(organisationId: string, id: string): Promise<void> {
    const position = await this.requirePosition(organisationId, id);
    // The employees' foreign key would refuse too; this says why, in the person's language.
    if ((await this.structureRepository.countHolders(organisationId, id)) > 0) {
      throw new BusinessRuleException('errors.structure.positionInUse');
    }
    if (!(await this.structureRepository.deletePosition(organisationId, id))) {
      throw new ResourceNotFoundException();
    }
    await this.auditService.record({
      action: AuditAction.POSITION_DELETED,
      employeeId: null,
      target: { type: AuditTargetType.POSITION, id, label: position.title },
      changes: changeOf(AuditField.TITLE, auditValue.text(position.title), null),
    });
  }

  private async requireDepartment(organisationId: string, id: string): Promise<DepartmentRecord> {
    const department = await this.structureRepository.findDepartment(organisationId, id);
    if (!department) {
      throw new ResourceNotFoundException();
    }
    return department;
  }

  private async requirePosition(
    organisationId: string,
    id: string,
  ): Promise<StructurePositionRecord> {
    const position = await this.structureRepository.findPosition(organisationId, id);
    if (!position) {
      throw new ResourceNotFoundException();
    }
    return position;
  }

  private async requireFreeDepartmentName(
    organisationId: string,
    name: string,
    exceptId?: string,
  ): Promise<void> {
    if (await this.structureRepository.departmentNameTaken(organisationId, name, exceptId)) {
      throw new BusinessConflictException('errors.structure.departmentNameTaken', { name }, 'name');
    }
  }

  private async requireFreePositionTitle(
    organisationId: string,
    title: string,
    exceptId?: string,
  ): Promise<void> {
    if (await this.structureRepository.positionTitleTaken(organisationId, title, exceptId)) {
      throw new BusinessConflictException(
        'errors.structure.positionTitleTaken',
        { title },
        'title',
      );
    }
  }
}
