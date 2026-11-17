import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
    MAX_ORGANISATION_NAME_LENGTH,
    MAX_PLAN_FEATURES,
    MAX_REJECTION_REASON_LENGTH,
} from '../../../../common/dto/limits';
import { FeatureSchema, PlanSchema } from '../../../../common/dto/plan';
import { ORGANISATION_STATUSES } from '../../../user/service/organisation-status';
import { USER_ROLES } from '../../../user/service/user-role';

export const UserRoleSchema = z.enum(USER_ROLES).meta({ id: 'UserRole' });

export const CurrentUserResponseSchema = z.object({
    id: z.uuid(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: UserRoleSchema,
    /** The caller's organisation (a user belongs to one). */
    organisation: z.object({
        id: z.uuid(),
        name: z.string().max(MAX_ORGANISATION_NAME_LENGTH),
        /** PENDING / REJECTED: only the waiting screen (and the own account) is open. */
        status: z.enum(ORGANISATION_STATUSES).meta({ id: 'OrganisationStatus' }),
        /** Why a platform admin rejected it; null otherwise. */
        rejectionReason: z.string().max(MAX_REJECTION_REASON_LENGTH).nullable(),
        /** What the company's plan allows — the UI shows upgrade prompts from it; the API enforces. */
        billing: z.object({
            plan: PlanSchema,
            features: z.array(FeatureSchema).max(MAX_PLAN_FEATURES),
            /** Active employees the plan allows; null = unlimited. */
            maxEmployees: z.number().int().min(1).nullable(),
            /** A payment failed: the plan stays until this instant, then Starter (owners see a banner). */
            graceEndsAt: z.iso.datetime().nullable(),
        }),
    }),
    /** Minutes without activity after which the session ends (the client warns before). */
    idleTimeoutMinutes: z.number().int().min(1),
    /**
     * One of the public demo's shared showcase accounts: actions that would lock other visitors
     * out are turned off for it. False for everyone else (a company a visitor created included).
     */
    isDemoRestricted: z.boolean(),
});

export class CurrentUserResponse extends createZodDto(CurrentUserResponseSchema) {}
