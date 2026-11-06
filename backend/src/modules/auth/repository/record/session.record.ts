import type { Prisma } from '../../../../generated/prisma/client';

export const sessionAuthenticationSelect = {
  id: true,
  userId: true,
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
