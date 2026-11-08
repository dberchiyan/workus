/** Mirrored by ck_organisations_status. A new company is PENDING until a platform admin decides. */
export const OrganisationStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
} as const;
export type OrganisationStatus = (typeof OrganisationStatus)[keyof typeof OrganisationStatus];
export const ORGANISATION_STATUSES = Object.values(OrganisationStatus) as [
  OrganisationStatus,
  ...OrganisationStatus[],
];
export const isOrganisationStatus = (value: string): value is OrganisationStatus =>
  (ORGANISATION_STATUSES as readonly string[]).includes(value);
