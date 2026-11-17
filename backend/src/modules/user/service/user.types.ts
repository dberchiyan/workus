import type { Plan } from '../../../common/plan/plan';
import type { OrganisationStatus } from './organisation-status';
import type { UserRole } from './user-role';

export interface UserCredentials {
  id: string;
  organisationId: string;
  email: string;
  /** null → no password (added by an admin before passwords were generated); cannot sign in. */
  passwordHash: string | null;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organisation: {
    id: string;
    name: string;
    status: OrganisationStatus;
    rejectionReason: string | null;
    /** The plan in effect (common/plan) and, after a failed payment, since when. */
    plan: Plan;
    pastDueSince: Date | null;
  };
}

export interface NewUser {
  organisationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  /** Argon2 hash of the generated password. */
  passwordHash: string;
  createdBy: string;
}

export interface NewOwner {
  organisationId: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
}

export interface Administrator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  version: number;
}
