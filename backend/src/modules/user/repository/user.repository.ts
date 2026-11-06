import { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../../common/persistence/prisma.service';
import {
  type UserCredentialsRecord,
  type UserProfileRecord,
  userCredentialsSelect,
  userProfileSelect,
} from './record/user.record';

@Injectable()
export class UserRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma<PrismaService>>,
  ) {}

  findCredentialsByEmail(email: string): Promise<UserCredentialsRecord | null> {
    return this.txHost.tx.user.findUnique({ where: { email }, select: userCredentialsSelect });
  }

  findProfileById(id: string): Promise<UserProfileRecord | null> {
    return this.txHost.tx.user.findUnique({ where: { id }, select: userProfileSelect });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.txHost.tx.user.count({ where: { email } }).then((count) => count > 0);
  }

  /** No password: the person sets one later (invitation flow). */
  async createWithoutPassword(user: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdBy: string;
  }): Promise<string> {
    const { id } = await this.txHost.tx.user.create({
      data: {
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

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.txHost.tx.user.update({
      where: { id },
      data: { passwordHash, updatedBy: id, version: { increment: 1 } },
      select: { id: true },
    });
  }
}
