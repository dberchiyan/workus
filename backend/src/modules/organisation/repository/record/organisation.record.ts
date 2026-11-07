import type { Prisma } from '../../../../generated/prisma/client';

export const organisationSelect = {
  id: true,
  name: true,
  version: true,
} satisfies Prisma.OrganisationSelect;
export type OrganisationRecord = Prisma.OrganisationGetPayload<{
  select: typeof organisationSelect;
}>;
