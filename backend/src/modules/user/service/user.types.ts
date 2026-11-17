import type { Plan } from '../../../common/plan/plan';
import type { OrganisationStatus } from './organisation-status';
import type { UserRole } from './user-role';

export interface UserCredentials {
    id: string;
    organisationId: string;
    email: string;
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
        plan: Plan;
        pastDueAt: Date | null;
    };
}

export interface NewUser {
    organisationId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
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
