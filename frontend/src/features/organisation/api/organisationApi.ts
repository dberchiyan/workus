import { apiClient } from '@/shared/api/client';
import type {
  AddAdministratorRequest,
  AddedAdministrator,
  Administrator,
  AdministratorPage,
  ChangeRoleRequest,
  Organisation,
  RegistrationRequest,
  UpdateOrganisationRequest,
} from '../types';

/** Administrators per page in Settings. */
export const ADMINISTRATORS_PAGE_SIZE = 10;

const BASE = '/api/v1/organisation';

/** The caller's organisation (from the session) and registering a new one. */
export const organisationApi = {
  /** A new company and its owner; the answer signs the owner in (session cookies). */
  register: async (request: RegistrationRequest): Promise<Organisation> =>
    (await apiClient.post<Organisation>('/api/v1/registrations', request)).data,
  find: async (): Promise<Organisation> => (await apiClient.get<Organisation>(BASE)).data,
  rename: async (request: UpdateOrganisationRequest): Promise<Organisation> =>
    (await apiClient.put<Organisation>(BASE, request)).data,
  administrators: async (search: string, page: number): Promise<AdministratorPage> =>
    (
      await apiClient.get<AdministratorPage>(`${BASE}/administrators`, {
        params: { search: search || undefined, page, size: ADMINISTRATORS_PAGE_SIZE },
      })
    ).data,
  /** A new admin with a generated password, in this answer only (null on a replayed retry). */
  addAdministrator: async (
    request: AddAdministratorRequest,
    idempotencyKey: string,
  ): Promise<AddedAdministrator> =>
    (
      await apiClient.post<AddedAdministrator>(`${BASE}/administrators`, request, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data,
  changeRole: async (userId: string, request: ChangeRoleRequest): Promise<Administrator> =>
    (
      await apiClient.put<Administrator>(
        `${BASE}/administrators/${encodeURIComponent(userId)}/role`,
        request,
      )
    ).data,
};
