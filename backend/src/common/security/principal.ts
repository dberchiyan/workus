export const ClientType = {
  WEB: 'web',
  MOBILE: 'mobile',
} as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];

/** The authenticated caller, resolved from the session on every request. */
export class Principal {
  constructor(
    readonly userId: string,
    readonly sessionId: string,
    readonly authorities: readonly string[],
    readonly clientType: ClientType,
    readonly csrfTokenHash: string,
  ) {}

  hasAuthority(authority: string): boolean {
    return this.authorities.includes(authority);
  }
}
