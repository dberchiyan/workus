/** No tenant id: the organisation comes from the session (see auth queryKeys). */
export const organisationKeys = {
  all: ['organisation'] as const,
  current: () => [...organisationKeys.all, 'current'] as const,
  administrators: () => [...organisationKeys.all, 'administrators'] as const,
  administratorsPage: (search: string, page: number) =>
    [...organisationKeys.administrators(), search, page] as const,
};
