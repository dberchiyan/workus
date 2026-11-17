import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { pageableOptions } from '../../../../common/dto/pageable';

export const SESSIONS_PAGEABLE = pageableOptions({
    sortable: ['lastSeenAt'] as const,
    defaultSort: 'lastSeenAt,desc',
});
export type SessionSortField = (typeof SESSIONS_PAGEABLE.sortable)[number];

const SessionSchema = z
    .object({
        id: z.uuid(),
        clientType: z.enum(['WEB', 'MOBILE']),
        ip: z.string().nullable(),
        userAgent: z.string().nullable(),
        createdAt: z.iso.datetime(),
        lastSeenAt: z.iso.datetime(),
    })
    .meta({ id: 'Session' });

export class SessionsResponse extends createZodDto(
    z.object({
        current: SessionSchema.nullable(),
        others: z.object({ content: z.array(SessionSchema), totalElements: z.number().int() }),
    }),
) {}
