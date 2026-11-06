import type { UserRole } from './user-role';

export interface UserCredentials {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
