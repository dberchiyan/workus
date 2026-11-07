import type { UserRole } from '../../user/service/user-role';

export interface RegisterCommand {
  organisationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  ip: string;
  userAgent: string | null;
  /** A session cookie sent along — deleted, never reused (no fixation). */
  presentedToken: string | undefined;
}

export interface ChangeRoleCommand {
  role: Extract<UserRole, 'OWNER' | 'ADMIN'>;
  version: number;
}
