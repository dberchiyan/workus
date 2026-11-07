/** No tenant id: the organisation comes from the session. Reviews are scoped by the employee. */
export const reviewKeys = {
  all: ['reviews'] as const,
  forEmployee: (employeeId: string) => [...reviewKeys.all, 'employee', employeeId] as const,
  candidates: (search: string) => [...reviewKeys.all, 'candidates', search] as const,
};

export const employeeReviewsKey = (employeeId: string) => reviewKeys.forEmployee(employeeId);
