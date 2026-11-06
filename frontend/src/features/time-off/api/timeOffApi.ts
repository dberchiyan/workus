import { apiClient } from '@/shared/api/client';
import type {
  CreateTimeOffRequest,
  LeaveBalances,
  TimeOffRequest,
  TimeOffRequestPage,
} from '../types';

const BASE = '/api/v1/time-off';

export const timeOffApi = {
  /** The signed-in employee's balances in the current cycles. */
  ownBalances: async (): Promise<LeaveBalances> =>
    (await apiClient.get<LeaveBalances>(`${BASE}/balances`)).data,
  /** One employee's balances (admin, profile). */
  employeeBalances: async (employeeId: string): Promise<LeaveBalances> =>
    (
      await apiClient.get<LeaveBalances>(
        `/api/v1/employees/${encodeURIComponent(employeeId)}/time-off/balances`,
      )
    ).data,
  /** `changedSince` (ISO instant): only pending requests and those changed since then. */
  ownRequests: async (
    page: number,
    size: number,
    changedSince: string,
  ): Promise<TimeOffRequestPage> =>
    (
      await apiClient.get<TimeOffRequestPage>(`${BASE}/requests`, {
        params: { page, size, sort: 'createdAt,desc', changedSince },
      })
    ).data,
  /** The key identifies one logical "create" — reused on retry so it never creates twice. */
  create: async (request: CreateTimeOffRequest, idempotencyKey: string): Promise<TimeOffRequest> =>
    (
      await apiClient.post<TimeOffRequest>(`${BASE}/requests`, request, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data,
  cancel: async (requestId: string): Promise<TimeOffRequest> =>
    (
      await apiClient.post<TimeOffRequest>(
        `${BASE}/requests/${encodeURIComponent(requestId)}/cancel`,
      )
    ).data,
};
