/** No tenant id: the organisation comes from the session (see auth queryKeys). */
export const organisationKeys = {
    all: ['organisation'] as const,
    current: (): readonly ['organisation', 'current'] => [...organisationKeys.all, 'current'] as const,
    administrators: (): readonly ['organisation', 'administrators'] =>
        [...organisationKeys.all, 'administrators'] as const,
    administratorsPage: (search: string, page: number): readonly ['organisation', 'administrators', string, number] =>
        [...organisationKeys.administrators(), search, page] as const,
};
