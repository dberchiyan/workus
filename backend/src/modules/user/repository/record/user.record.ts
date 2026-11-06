import type { Prisma } from '../../../../generated/prisma/client';

export const userCredentialsSelect = {
  id: true,
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
} satisfies Prisma.UserSelect;
export type UserProfileRecord = Prisma.UserGetPayload<{ select: typeof userProfileSelect }>;
