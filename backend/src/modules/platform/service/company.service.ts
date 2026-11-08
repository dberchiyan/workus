import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../common/dto/pageable';
import {
  BusinessRuleException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../common/exception/api.exception';
import type { Principal } from '../../../common/security/principal';
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import { AuditField, auditValue, changeOf } from '../../audit/service/audit-change';
import { AuditService } from '../../audit/service/audit.service';
import { OrganisationStatus } from '../../user/service/organisation-status';
import type { CompanyRecord, CompanyUserRecord } from '../repository/record/company.record';
import { CompanyRepository } from '../repository/company.repository';
import type { CompanyPeople, CompanySortField, CompanyUserSortField } from './company-sort';

const MAX_SEARCH_TERMS = 5;
const toSearchTerms = (search: string | undefined): string[] =>
  (search ?? '').split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_TERMS);

const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Platform administration of companies: the list, one company with its people (directory facts
 * only), and approving or rejecting a sign-up. Policies have checked the caller is a platform
 * admin and the company exists.
 */
@Injectable()
export class CompanyService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly auditService: AuditService,
  ) {}

  findPage(
    query: { status: OrganisationStatus; search: string | undefined },
    pageable: Pageable<CompanySortField>,
  ): Promise<{ content: CompanyRecord[]; totalElements: number }> {
    return this.companyRepository.findPage(
      { status: query.status, searchTerms: toSearchTerms(query.search), today: todayUtc() },
      pageable,
    );
  }

  async counts(): Promise<Record<OrganisationStatus, number>> {
    const counts = await this.companyRepository.countByStatus();
    return {
      PENDING: counts.get(OrganisationStatus.PENDING) ?? 0,
      ACTIVE: counts.get(OrganisationStatus.ACTIVE) ?? 0,
      REJECTED: counts.get(OrganisationStatus.REJECTED) ?? 0,
    };
  }

  async find(organisationId: string): Promise<CompanyRecord> {
    const company = await this.companyRepository.findById(organisationId, todayUtc());
    if (!company) {
      throw new ResourceNotFoundException();
    }
    return company;
  }

  findPeople(
    organisationId: string,
    query: { people: CompanyPeople | null; search: string | undefined },
    pageable: Pageable<CompanyUserSortField>,
  ): Promise<{ content: CompanyUserRecord[]; totalElements: number }> {
    return this.companyRepository.findUserPage(
      organisationId,
      { people: query.people, searchTerms: toSearchTerms(query.search) },
      pageable,
    );
  }

  /** A waiting (or earlier rejected) company becomes active; approving again changes nothing. */
  @Transactional()
  async approve(principal: Principal, organisationId: string): Promise<CompanyRecord> {
    const before = await this.find(organisationId);
    if (before.status === OrganisationStatus.ACTIVE) {
      return before;
    }
    if (
      !(await this.companyRepository.decide(
        organisationId,
        [OrganisationStatus.PENDING, OrganisationStatus.REJECTED],
        { status: OrganisationStatus.ACTIVE, rejectionReason: null, decidedBy: principal.userId },
      ))
    ) {
      throw new ConcurrentModificationException();
    }
    await this.record(AuditAction.ORGANISATION_APPROVED, before, null);
    return this.find(organisationId);
  }

  /**
   * A waiting company is rejected, saying why (its owner sees it); rejecting again changes
   * nothing. An active company is not rejected (suspending is a later feature).
   */
  @Transactional()
  async reject(
    principal: Principal,
    organisationId: string,
    reason: string,
  ): Promise<CompanyRecord> {
    const before = await this.find(organisationId);
    if (before.status === OrganisationStatus.REJECTED) {
      return before;
    }
    if (before.status === OrganisationStatus.ACTIVE) {
      throw new BusinessRuleException('errors.platform.activeNotRejectable');
    }
    if (
      !(await this.companyRepository.decide(organisationId, [OrganisationStatus.PENDING], {
        status: OrganisationStatus.REJECTED,
        rejectionReason: reason,
        decidedBy: principal.userId,
      }))
    ) {
      throw new ConcurrentModificationException();
    }
    await this.record(AuditAction.ORGANISATION_REJECTED, before, reason);
    return this.find(organisationId);
  }

  /** In the company's own history (its organisation), by the platform admin. */
  private record(
    action: AuditAction,
    company: CompanyRecord,
    reason: string | null,
  ): Promise<void> {
    return this.auditService.record({
      action,
      organisationId: company.id,
      employeeId: null,
      target: { type: AuditTargetType.ORGANISATION, id: company.id, label: company.name },
      changes: [
        ...changeOf(
          AuditField.STATUS,
          auditValue.text(company.status),
          auditValue.text(
            action === AuditAction.ORGANISATION_APPROVED
              ? OrganisationStatus.ACTIVE
              : OrganisationStatus.REJECTED,
          ),
        ),
        ...(reason ? changeOf(AuditField.DECISION_COMMENT, null, auditValue.text(reason)) : []),
      ],
    });
  }
}
