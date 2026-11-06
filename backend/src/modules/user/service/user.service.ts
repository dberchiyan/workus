import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { isUserRole, type UserRole } from './user-role';
import type { UserCredentials, UserProfile } from './user.types';

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

  async findProfileById(id: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findProfileById(id);
    return user ? { ...user, role: toRole(user.role) } : null;
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    return this.userRepository.updatePasswordHash(id, passwordHash);
  }
}
