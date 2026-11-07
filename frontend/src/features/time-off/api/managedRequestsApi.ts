import { apiClient } from '@/shared/api/client';
import type {
  ClosedStatus,
  ManagedRequest,
  ManagedRequestPage,
  TimeOffComment,
  TimeOffDecision,
  TimeOffType,
} from '../types';

const BASE = '/api/v1/time-off-requests';

export interface ManagedRequestsQuery {
  state: 'PENDING' | 'CLOSED';
  type: TimeOffType | undefined;
  status: ClosedStatus | undefined;
  mine: boolean;
  search: string;
  page: number;
  size: number;
}

/** Each decision is a sub-resource of the request (api.md → Paths). */
const DECISION_PATHS = {
  approve: 'approval',
  reject: 'rejection',
  cancel: 'cancellation',
} as const satisfies Record<TimeOffDecision, string>;

const requestUrl = (requestId: string): string => `${BASE}/${encodeURIComponent(requestId)}`;

/** Every employee's requests (admin). */
export const managedRequestsApi = {
  /** Pending: the longest waiting first; closed: the latest change first. */
  list: async (query: ManagedRequestsQuery): Promise<ManagedRequestPage> =>
    (
      await apiClient.get<ManagedRequestPage>(BASE, {
        params: {
          state: query.state,
          page: query.page,
          size: query.size,
          sort: query.state === 'PENDING' ? 'createdAt,asc' : 'updatedAt,desc',
          ...(query.type ? { type: query.type } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(query.mine ? { mine: 'true' } : {}),
          ...(query.search ? { search: query.search } : {}),
        },
      })
    ).data,
  get: async (requestId: string): Promise<ManagedRequest> =>
    (await apiClient.get<ManagedRequest>(requestUrl(requestId))).data,
  decide: async (requestId: string, decision: TimeOffDecision): Promise<ManagedRequest> =>
    (await apiClient.post<ManagedRequest>(`${requestUrl(requestId)}/${DECISION_PATHS[decision]}`))
      .data,
  /** The key identifies one logical "send" — reused on retry so it never posts twice. */
  comment: async (
    requestId: string,
    body: string,
    idempotencyKey: string,
  ): Promise<TimeOffComment> =>
    (
      await apiClient.post<TimeOffComment>(
        `${requestUrl(requestId)}/comments`,
        { body },
        { headers: { 'Idempotency-Key': idempotencyKey } },
      )
    ).data,
};
