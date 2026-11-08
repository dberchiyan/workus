import type { Prisma } from '../../../../generated/prisma/client';

export const userCredentialsSelect = {
  id: true,
  organisationId: true,
  email: true,
  passwordHash: true,
  role: true,
} satisfies Prisma.UserSelect;
export type UserCredentialsRecord = Prisma.UserGetPayload<{ select: typeof userCredentialsSelect }>;

export const userProfileSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  organisation: { select: { id: true, name: true, status: true, rejectionReason: true } },
} satisfies Prisma.UserSelect;
export type UserProfileRecord = Prisma.UserGetPayload<{ select: typeof userProfileSelect }>;

/** An administrator (owner or admin) of the organisation, as Settings → Administrators lists them. */
export const administratorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  version: true,
} satisfies Prisma.UserSelect;
export type AdministratorRecord = Prisma.UserGetPayload<{ select: typeof administratorSelect }>;
