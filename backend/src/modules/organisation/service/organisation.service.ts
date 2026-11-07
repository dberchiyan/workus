import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Pageable } from '../../../common/dto/pageable';
import {
  BusinessConflictException,
  BusinessRuleException,
  ConcurrentModificationException,
  ResourceNotFoundException,
} from '../../../common/exception/api.exception';
import type { Principal } from '../../../common/security/principal';
import { AuditAction, AuditTargetType } from '../../audit/service/audit-action';
import { AuditField, auditValue, changeOf } from '../../audit/service/audit-change';
import { AuditService } from '../../audit/service/audit.service';
import { AuthService } from '../../auth/service/auth.service';
import { PasswordHasher } from '../../auth/service/password-hasher.service';
import type { StartedSession } from '../../auth/service/session.service';
import { SessionService } from '../../auth/service/session.service';
import type { AdministratorSortField } from '../../user/service/administrator-sort';
import { ADMIN_ROLES, authoritiesFor, UserRole } from '../../user/service/user-role';
import { UserService } from '../../user/service/user.service';
import type { Administrator } from '../../user/service/user.types';
import type { OrganisationRecord } from '../repository/record/organisation.record';
import { OrganisationRepository } from '../repository/organisation.repository';
import type { ChangeRoleCommand, RegisterCommand } from './organisation.types';

const MAX_SEARCH_TERMS = 5;

const toSearchTerms = (search: string | undefined): string[] =>
  (search ?? '').split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_TERMS);

const isAdministrator = (role: UserRole): boolean =>
  (ADMIN_ROLES as readonly UserRole[]).includes(role);

/**
 * The tenant: registering a company (the organisation, its first owner and their session), its
 * settings, and who runs it (owners and admins).
 */
@Injectable()
export class OrganisationService {
  constructor(
    private readonly organisationRepository: OrganisationRepository,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditService: AuditService,
    @InjectPinoLogger(OrganisationService.name) private readonly logger: PinoLogger,
  ) {}

  /**
   * A new company: the organisation and its owner (signed in at once). Emails are unique across
   * organisations, so a taken one is refused (409) — that tells the address has an account
   * somewhere (accepted; registration is rate-limited per IP).
   */
  async register(
    command: RegisterCommand,
  ): Promise<{ organisation: OrganisationRecord; session: StartedSession }> {
    const email = command.email.toLowerCase();
    if (await this.userService.existsByEmail(email)) {
      throw new BusinessConflictException('errors.registration.emailTaken', {}, 'email');
    }
    // Hashing is CPU work, done before the transaction opens.
    const passwordHash = await this.passwordHasher.hash(command.password);
    const result = await this.createWithOwner({ ...command, email }, passwordHash);
    this.logger.info(
      { organisationId: result.organisation.id, email, ip: command.ip },
      'Organisation registered',
    );
    return result;
  }

  @Transactional()
  private async createWithOwner(
    command: RegisterCommand,
    passwordHash: string,
  ): Promise<{ organisation: OrganisationRecord; session: StartedSession }> {
    const organisation = await this.organisationRepository.create(command.organisationName);
    const userId = await this.userService.createOwner({
      organisationId: organisation.id,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
      passwordHash,
    });
    await this.auditService.record({
      action: AuditAction.ORGANISATION_CREATED,
      organisationId: organisation.id,
      actorUserId: userId,
      employeeId: null,
      target: { type: AuditTargetType.ORGANISATION, id: organisation.id, label: organisation.name },
      changes: changeOf(AuditField.NAME, null, auditValue.text(organisation.name)),
    });
    const session = await this.authService.startSession(
      { id: userId, organisationId: organisation.id, role: UserRole.OWNER },
      command,
    );
    return { organisation, session };
  }

  async find(organisationId: string): Promise<OrganisationRecord> {
    const organisation = await this.organisationRepository.findById(organisationId);
    if (!organisation) {
      throw new ResourceNotFoundException();
    }
    return organisation;
  }

  /** The name (owners only); a save without a change writes nothing. */
  @Transactional()
  async rename(
    organisationId: string,
    command: { name: string; version: number },
    actorId: string,
  ): Promise<OrganisationRecord> {
    const before = await this.find(organisationId);
    if (before.version !== command.version) {
      throw new ConcurrentModificationException();
    }
    if (before.name === command.name) {
      return before;
    }
    if (
      !(await this.organisationRepository.rename(
        organisationId,
        command.version,
        command.name,
        actorId,
      ))
    ) {
      throw new ConcurrentModificationException();
    }
    await this.auditService.record({
      action: AuditAction.ORGANISATION_UPDATED,
      employeeId: null,
      target: { type: AuditTargetType.ORGANISATION, id: organisationId, label: command.name },
      changes: changeOf(
        AuditField.NAME,
        auditValue.text(before.name),
        auditValue.text(command.name),
      ),
    });
    return this.find(organisationId);
  }

  administrators(
    organisationId: string,
    search: string | undefined,
    pageable: Pageable<AdministratorSortField>,
  ): Promise<{ content: Administrator[]; totalElements: number }> {
    return this.userService.findAdministratorPage(organisationId, toSearchTerms(search), pageable);
  }

  /**
   * Makes an administrator an owner, or an owner an admin (owners only). The last owner stays
   * one. The person's sessions end (authorities are a snapshot) — except the one they act from
   * when they change their own role.
   */
  @Transactional()
  async changeRole(
    principal: Principal,
    userId: string,
    command: ChangeRoleCommand,
  ): Promise<Administrator> {
    const organisationId = principal.organisationId;
    await this.organisationRepository.lock(organisationId);
    const before = await this.userService.findAdministrator(organisationId, userId);
    if (!before) {
      throw new ResourceNotFoundException();
    }
    if (!isAdministrator(before.role)) {
      throw new BusinessRuleException('errors.organisation.notAdministrator');
    }
    if (before.version !== command.version) {
      throw new ConcurrentModificationException();
    }
    if (before.role === command.role) {
      return before;
    }
    if (
      before.role === UserRole.OWNER &&
      (await this.userService.countOwners(organisationId)) <= 1
    ) {
      throw new BusinessRuleException('errors.organisation.lastOwner');
    }
    if (
      !(await this.userService.updateRole(
        organisationId,
        userId,
        command.version,
        command.role,
        principal.userId,
      ))
    ) {
      throw new ConcurrentModificationException();
    }
    await this.sessionService.applyRoleChange(
      userId,
      authoritiesFor(command.role),
      userId === principal.userId ? principal.sessionId : null,
    );
    await this.auditService.record({
      action: AuditAction.USER_ROLE_CHANGED,
      employeeId: null,
      target: {
        type: AuditTargetType.USER,
        id: userId,
        label: `${before.firstName} ${before.lastName}`,
      },
      changes: changeOf(
        AuditField.ROLE,
        auditValue.text(before.role),
        auditValue.text(command.role),
      ),
    });
    const after = await this.userService.findAdministrator(organisationId, userId);
    if (!after) {
      throw new Error('Administrator not found in the same transaction');
    }
    return after;
  }
}
