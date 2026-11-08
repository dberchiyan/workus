export const ClientType = {
  WEB: 'web',
  MOBILE: 'mobile',
} as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];

/**
 * The authenticated caller, resolved from the session on every request. `organisationId` is the
 * caller's tenant (a user belongs to one organisation): every query is scoped by it.
 */
export class Principal {
  constructor(
    readonly userId: string,
    readonly organisationId: string,
    /** The organisation is approved (ACTIVE): its data is reachable. */
    readonly isOrganisationActive: boolean,
    readonly sessionId: string,
    readonly authorities: readonly string[],
    readonly clientType: ClientType,
    readonly csrfTokenHash: string,
  ) {}

  hasAuthority(authority: string): boolean {
    return this.authorities.includes(authority);
  }
}
