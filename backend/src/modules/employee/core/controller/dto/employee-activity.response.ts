import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AUDIT_TARGET_TYPES, RECORD_ACTIONS } from '../../../../audit/service/audit-action';
import { AuditChangeSchema } from '../../../../audit/service/audit-change';
import { pageResponseSchema } from '../../../../../common/dto/page.response';

const ActivityEventSchema = z.object({
  id: z.uuid(),
  occurredAt: z.iso.datetime(),
  action: z.enum(RECORD_ACTIONS),
  /** null = a change made by the system. */
  actor: z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string() }).nullable(),
  target: z.object({
    type: z.enum(AUDIT_TARGET_TYPES),
    id: z.uuid(),
    /** The name at the time of the change (a deleted review keeps it). */
    label: z.string(),
  }),
  // z.object(shape) gives the copy its own OpenAPI name.
  changes: z.array(z.object(AuditChangeSchema.shape)),
});

export const EmployeeActivityPageSchema = pageResponseSchema(ActivityEventSchema);

export class EmployeeActivityPageResponse extends createZodDto(EmployeeActivityPageSchema) {}
