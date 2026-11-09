import type { Prisma } from '../../../../generated/prisma/client';

export const sessionAuthenticationSelect = {
  id: true,
  userId: true,
  user: {
    select: { email: true, organisationId: true, organisation: { select: { status: true } } },
  },
  authorities: true,
  clientType: true,
  csrfTokenHash: true,
  lastSeenAt: true,
  idleExpiresAt: true,
  absoluteExpiresAt: true,
} satisfies Prisma.SessionSelect;
export type SessionAuthenticationRecord = Prisma.SessionGetPayload<{
  select: typeof sessionAuthenticationSelect;
}>;

/** A session as its owner sees it in Settings. */
export const sessionListSelect = {
  id: true,
  clientType: true,
  ip: true,
  userAgent: true,
  createdAt: true,
  lastSeenAt: true,
} satisfies Prisma.SessionSelect;
export type SessionListRecord = Prisma.SessionGetPayload<{ select: typeof sessionListSelect }>;
