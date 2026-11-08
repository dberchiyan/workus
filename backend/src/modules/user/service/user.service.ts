import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../common/dto/pageable';
import type { AdministratorRecord } from '../repository/record/user.record';
import { UserRepository } from '../repository/user.repository';
import type { AdministratorSortField } from './administrator-sort';
import { isUserRole, UserRole } from './user-role';
import type { Administrator, NewOwner, NewUser, UserCredentials, UserProfile } from './user.types';

const toRole = (role: string): UserRole => {
  if (!isUserRole(role)) {
    // Guarded by ck_users_role; reaching this means the schema and code disagree.
    throw new Error('Unknown user role in database');
  }
  return role;
};

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user = await this.userRepository.findCredentialsByEmail(email);
    return user ? { ...user, role: toRole(user.role) } : null;
  }

  async findCredentialsById(id: string): Promise<UserCredentials | null> {
    const user = await this.userRepository.findCredentialsById(id);
    return user ? { ...user, role: toRole(user.role) } : null;
  }

  async findProfileById(id: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findProfileById(id);
    return user ? { ...user, role: toRole(user.role) } : null;
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email.toLowerCase());
  }

  /** Is the email taken by another user? (Compared lower-case.) */
  isEmailTakenByOther(email: string, userId: string): Promise<boolean> {
    return this.userRepository.existsByEmailExcept(email.toLowerCase(), userId);
  }

  /** Name and sign-in email; the email is stored lower-case. */
  updateIdentity(
    id: string,
    identity: { firstName: string; lastName: string; email: string },
    updatedBy: string,
  ): Promise<void> {
    return this.userRepository.updateIdentity(
      id,
      { ...identity, email: identity.email.toLowerCase() },
      updatedBy,
    );
  }

  /** Returns the new user's id. Email is stored lower-case. */
  createWithPassword(user: NewUser): Promise<string> {
    return this.userRepository.createWithPassword({ ...user, email: user.email.toLowerCase() });
  }

  updatePasswordHash(id: string, passwordHash: string, updatedBy: string = id): Promise<void> {
    return this.userRepository.updatePasswordHash(id, passwordHash, updatedBy);
  }

  /** Returns the new owner's id. Email is stored lower-case. */
  createOwner(owner: NewOwner): Promise<string> {
    return this.userRepository.createOwner({
      ...owner,
      email: owner.email.toLowerCase(),
      role: UserRole.OWNER,
    });
  }

  /** Owners and admins of the organisation; `searchTerms` each match name or email. */
  async findAdministratorPage(
    organisationId: string,
    searchTerms: string[],
    pageable: Pageable<AdministratorSortField>,
  ): Promise<{ content: Administrator[]; totalElements: number }> {
    const page = await this.userRepository.findAdministratorPage(
      organisationId,
      searchTerms,
      pageable,
    );
    return { content: page.content.map(toAdministrator), totalElements: page.totalElements };
  }

  /** A user of the organisation with their role (any role); null when unknown there. */
  async findAdministrator(organisationId: string, userId: string): Promise<Administrator | null> {
    const user = await this.userRepository.findAdministrator(organisationId, userId);
    return user ? toAdministrator(user) : null;
  }

  countOwners(organisationId: string): Promise<number> {
    return this.userRepository.countByRole(organisationId, UserRole.OWNER);
  }

  /** False when the version is stale. */
  updateRole(
    organisationId: string,
    userId: string,
    version: number,
    role: UserRole,
    updatedBy: string,
  ): Promise<boolean> {
    return this.userRepository.updateRole(organisationId, userId, version, role, updatedBy);
  }
}

const toAdministrator = (user: AdministratorRecord): Administrator => ({
  ...user,
  role: toRole(user.role),
});
