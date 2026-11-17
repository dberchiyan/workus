import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { pageResponseSchema } from '../../../../../common/dto/page.response';
import { AUDIT_TARGET_TYPES, RECORD_ACTIONS } from '../../../../audit/service/audit-action';
import { AuditChangeSchema } from '../../../../audit/service/audit-change';

const ActivityEventSchema = z.object({
    id: z.uuid(),
    occurredAt: z.iso.datetime(),
    action: z.enum(RECORD_ACTIONS),
    actor: z.object({ id: z.uuid(), firstName: z.string(), lastName: z.string() }).nullable(),
    target: z.object({
        type: z.enum(AUDIT_TARGET_TYPES),
        id: z.uuid(),
        label: z.string(),
    }),
    changes: z.array(z.object(AuditChangeSchema.shape)),
});

export const EmployeeActivityPageSchema = pageResponseSchema(ActivityEventSchema);

export class EmployeeActivityPageResponse extends createZodDto(EmployeeActivityPageSchema) {}
