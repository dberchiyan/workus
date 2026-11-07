import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { pageableOptions } from '../../../../common/dto/pageable';

/** Other sessions: most recently used first — the order is fixed, only page and size apply. */
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
    /** As the browser sent it; the client turns it into "Chrome on macOS". */
    userAgent: z.string().nullable(),
    createdAt: z.iso.datetime(),
    lastSeenAt: z.iso.datetime(),
  })
  .meta({ id: 'Session' });

export class SessionsResponse extends createZodDto(
  z.object({
    /** The session making this request. */
    current: SessionSchema.nullable(),
    /** A page of the other live sessions. */
    others: z.object({ content: z.array(SessionSchema), totalElements: z.number().int() }),
  }),
) {}
