/** No tenant: one company per installation. "own" = the signed-in employee. */
export const timeOffKeys = {
  all: ['time-off'] as const,
  ownBalances: () => [...timeOffKeys.all, 'own', 'balances'] as const,
  ownRequests: () => [...timeOffKeys.all, 'own', 'requests'] as const,
  ownRequestsSince: (changedSince: string) => [...timeOffKeys.ownRequests(), changedSince] as const,
  employeeBalances: (employeeId: string) =>
    [...timeOffKeys.all, 'employee', employeeId, 'balances'] as const,
};
