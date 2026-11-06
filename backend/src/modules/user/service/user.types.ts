import type { UserRole } from './user-role';

export interface UserCredentials {
  id: string;
  email: string;
  /** null → no password set yet (created by an admin); such an account cannot sign in. */
  passwordHash: string | null;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface NewUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdBy: string;
}
