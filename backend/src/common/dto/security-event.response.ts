import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SECURITY_CATEGORIES } from '../../modules/audit/service/security-category';
import { pageResponseSchema } from './page.response';

/** Security-log actions (auth.*) as the API names them. */
export const SECURITY_ACTIONS = [
  'auth.signed_in',
  'auth.sign_in_failed',
  'auth.sign_in_refused',
  'auth.signed_out',
  'auth.password_changed',
  'auth.password_reset',
  'auth.session_ended',
  'auth.other_sessions_ended',
  'auth.session_evicted',
  'auth.sessions_ended_on_termination',
  'auth.sign_in_locked',
] as const;
export type SecurityAction = (typeof SECURITY_ACTIONS)[number];
export const isSecurityAction = (action: string): action is SecurityAction =>
  (SECURITY_ACTIONS as readonly string[]).includes(action);

export const SecurityEventSchema = z
  .object({
    id: z.uuid(),
    action: z.enum(SECURITY_ACTIONS),
    occurredAt: z.iso.datetime(),
    ip: z.string().nullable(),
    /** As the browser sent it; the client turns it into "Chrome on macOS". */
    userAgent: z.string().nullable(),
    /** A sign-in from a device the user had not signed in from before. */
    newDevice: z.boolean(),
  })
  .meta({ id: 'SecurityEvent' });

/** A user's security log, newest first (own in Settings; an employee's for admins). */
export const SecurityEventPageSchema = pageResponseSchema(SecurityEventSchema);
export type SecurityEventPageBody = z.infer<typeof SecurityEventPageSchema>;

/** Maps the audit service's page; only auth.* actions belong here. */
export const toSecurityEventPage = (page: {
  content: {
    id: string;
    occurredAt: Date;
    action: string;
    ipAddress: string | null;
    userAgent: string | null;
    newDevice: boolean;
  }[];
  totalElements: number;
}): SecurityEventPageBody => ({
  content: page.content.flatMap((event) =>
    isSecurityAction(event.action)
      ? [
          {
            id: event.id,
            action: event.action,
            occurredAt: event.occurredAt.toISOString(),
            ip: event.ipAddress,
            userAgent: event.userAgent,
            newDevice: event.newDevice,
          },
        ]
      : [],
  ),
  totalElements: page.totalElements,
});

/** `?category=` of both security-log endpoints; absent = every event. */
export const SecurityLogQuerySchema = z.object({
  category: z.enum(SECURITY_CATEGORIES, { error: 'validation.invalid' }).optional(),
});
export class SecurityLogQuery extends createZodDto(SecurityLogQuerySchema) {}
