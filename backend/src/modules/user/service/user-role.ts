export const UserRole = {
    PLATFORM_ADMIN: 'PLATFORM_ADMIN',
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLES = Object.values(UserRole) as [UserRole, ...UserRole[]];

export const isUserRole = (value: string): value is UserRole => (USER_ROLES as readonly string[]).includes(value);

export const ADMIN_ROLES = [UserRole.OWNER, UserRole.ADMIN] as const satisfies readonly UserRole[];

/**
 * What a session of this role may do: an owner holds the admin authority too, so every admin
 * policy admits owners and only owner policies ask for OWNER.
 */
export const authoritiesFor = (role: UserRole): string[] =>
    role === UserRole.OWNER ? [UserRole.OWNER, UserRole.ADMIN] : [role];
