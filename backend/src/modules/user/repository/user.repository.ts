import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { Pageable } from '../../../common/dto/pageable';
import { toPrismaPage } from '../../../common/persistence/pageable';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';
import { ADMIN_ROLES } from '../service/user-role';
import type { AdministratorSortField } from '../service/administrator-sort';
import {
  type AdministratorRecord,
  administratorSelect,
  type UserCredentialsRecord,
  type UserProfileRecord,
  userCredentialsSelect,
  userProfileSelect,
} from './record/user.record';

const administratorOrderBy = (
  _field: AdministratorSortField,
  direction: Prisma.SortOrder,
): Prisma.UserOrderByWithRelationInput[] => [{ firstName: direction }, { lastName: direction }];

const administratorsWhere = (
  organisationId: string,
  searchTerms: string[],
): Prisma.UserWhereInput => ({
  organisationId,
  role: { in: [...ADMIN_ROLES] },
  AND: searchTerms.map((term) => ({
    OR: [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ],
  })),
});

@Injectable()
export class UserRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  findCredentialsByEmail(email: string): Promise<UserCredentialsRecord | null> {
    return this.txHost.tx.user.findUnique({ where: { email }, select: userCredentialsSelect });
  }

  findCredentialsById(id: string): Promise<UserCredentialsRecord | null> {
    return this.txHost.tx.user.findUnique({ where: { id }, select: userCredentialsSelect });
  }

  findProfileById(id: string): Promise<UserProfileRecord | null> {
    return this.txHost.tx.user.findUnique({ where: { id }, select: userProfileSelect });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.txHost.tx.user.count({ where: { email } }).then((count) => count > 0);
  }

  /** Is the email used by anyone other than `exceptUserId`? */
  existsByEmailExcept(email: string, exceptUserId: string): Promise<boolean> {
    return this.txHost.tx.user
      .count({ where: { email, id: { not: exceptUserId } } })
      .then((count) => count > 0);
  }

  async updateIdentity(
    id: string,
    identity: { firstName: string; lastName: string; email: string },
    updatedBy: string,
  ): Promise<void> {
    await this.txHost.tx.user.update({
      where: { id },
      data: { ...identity, updatedBy, version: { increment: 1 } },
      select: { id: true },
    });
  }

  /** An account an admin creates; its password is generated and shown to the admin once. */
  async createWithPassword(user: {
    organisationId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    passwordHash: string;
    createdBy: string;
  }): Promise<string> {
    const { id } = await this.txHost.tx.user.create({
      data: {
        passwordHash: user.passwordHash,
        organisationId: user.organisationId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdBy: user.createdBy,
        updatedBy: user.createdBy,
      },
      select: { id: true },
    });
    return id;
  }

  /** `updatedBy`: the user themselves, or the admin who reset it. */
  async updatePasswordHash(id: string, passwordHash: string, updatedBy: string): Promise<void> {
    await this.txHost.tx.user.update({
      where: { id },
      data: { passwordHash, updatedBy, version: { increment: 1 } },
      select: { id: true },
    });
  }

  /**
   * A new organisation's first account: an owner who chose a password at registration (no
   * creator — nobody was signed in).
   */
  async createOwner(user: {
    organisationId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    passwordHash: string;
  }): Promise<string> {
    const { id } = await this.txHost.tx.user.create({
      data: {
        organisationId: user.organisationId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash: user.passwordHash,
      },
      select: { id: true },
    });
    return id;
  }

  /** Owners and admins of the organisation, matching every search term, a page at a time. */
  async findAdministratorPage(
    organisationId: string,
    searchTerms: string[],
    pageable: Pageable<AdministratorSortField>,
  ): Promise<{ content: AdministratorRecord[]; totalElements: number }> {
    const where = administratorsWhere(organisationId, searchTerms);
    const page = toPrismaPage(pageable, administratorOrderBy, (direction) => ({ id: direction }));
    // In parallel (api.md → Pagination): a concurrent write may make them differ by a row.
    const [totalElements, content] = await Promise.all([
      this.txHost.tx.user.count({ where }),
      this.txHost.tx.user.findMany({ where, select: administratorSelect, ...page }),
    ]);
    return { content, totalElements };
  }

  findAdministrator(organisationId: string, userId: string): Promise<AdministratorRecord | null> {
    return this.txHost.tx.user.findUnique({
      where: { id: userId, organisationId },
      select: administratorSelect,
    });
  }

  countByRole(organisationId: string, role: string): Promise<number> {
    return this.txHost.tx.user.count({ where: { organisationId, role } });
  }

  /** Optimistic lock on the user's version; false → changed by someone else meanwhile. */
  async updateRole(
    organisationId: string,
    userId: string,
    version: number,
    role: string,
    updatedBy: string,
  ): Promise<boolean> {
    const { count } = await this.txHost.tx.user.updateMany({
      where: { id: userId, organisationId, version },
      data: { role, updatedBy, version: { increment: 1 } },
    });
    return count > 0;
  }
}
