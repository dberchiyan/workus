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
    organisation: z.object({
        id: z.uuid(),
        name: z.string().max(MAX_ORGANISATION_NAME_LENGTH),
        status: z.enum(ORGANISATION_STATUSES).meta({ id: 'OrganisationStatus' }),
        rejectionReason: z.string().max(MAX_REJECTION_REASON_LENGTH).nullable(),
        billing: z.object({
            plan: PlanSchema,
            features: z.array(FeatureSchema).max(MAX_PLAN_FEATURES),
            maxEmployees: z.number().int().min(1).nullable(),
            graceEndsAt: z.iso.datetime().nullable(),
        }),
    }),
    idleTimeoutMinutes: z.number().int().min(1),
    isDemoRestricted: z.boolean(),
});

export class CurrentUserResponse extends createZodDto(CurrentUserResponseSchema) {}
