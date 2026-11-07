import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { isUserRole, type UserRole } from './user-role';
import type { NewUser, UserCredentials, UserProfile } from './user.types';

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
  createWithoutPassword(user: NewUser): Promise<string> {
    return this.userRepository.createWithoutPassword({ ...user, email: user.email.toLowerCase() });
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    return this.userRepository.updatePasswordHash(id, passwordHash);
  }
}
