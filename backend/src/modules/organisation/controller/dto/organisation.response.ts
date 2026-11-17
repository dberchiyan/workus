import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MAX_ORGANISATION_NAME_LENGTH } from '../../../../common/dto/limits';
import { OrganisationNameSchema } from './registration.request';

export const OrganisationResponseSchema = z.object({
    id: z.uuid(),
    name: z.string().max(MAX_ORGANISATION_NAME_LENGTH),
    version: z.number().int(),
});

export class OrganisationResponse extends createZodDto(OrganisationResponseSchema) {}

export const UpdateOrganisationRequestSchema = z.object({
    name: OrganisationNameSchema,
    version: z.number().int().min(0),
});

export class UpdateOrganisationRequest extends createZodDto(UpdateOrganisationRequestSchema) {}
