import type { UserRole } from '../../user/service/user-role';

export interface RegisterCommand {
    organisationName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    ip: string;
    userAgent: string | null;
    presentedToken: string | undefined;
}

export interface AddAdministratorCommand {
    firstName: string;
    lastName: string;
    email: string;
}

export interface ChangeRoleCommand {
    role: Extract<UserRole, 'OWNER' | 'ADMIN'>;
    version: number;
}
