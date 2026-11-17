/** No tenant id: the company comes from the session (cache cleared on sign-out). */
export const billingKeys = {
    all: ['billing'] as const,
    summary: () => [...billingKeys.all, 'summary'] as const,
    info: () => [...billingKeys.all, 'info'] as const,
};
