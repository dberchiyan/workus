import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { personName } from '../../../../common/dto/person-name';

/** No version: only the person themselves changes their account name (admins and owners). */
export const UpdateOwnNameRequestSchema = z.object({
  firstName: personName('firstName'),
  lastName: personName('lastName'),
});

export class UpdateOwnNameRequest extends createZodDto(UpdateOwnNameRequestSchema) {}
