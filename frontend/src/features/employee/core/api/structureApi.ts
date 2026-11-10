import { apiClient } from '@/shared/api/client';
import type { CompanyStructure, Department, StructurePosition } from '../types';

const BASE = '/api/v1/structure';
const enc = encodeURIComponent;

/** Settings → Company structure: the organisation's departments and positions (admins). */
export const structureApi = {
  find: async (): Promise<CompanyStructure> => (await apiClient.get<CompanyStructure>(BASE)).data,
  /** The key identifies one logical "add" — reused on retry so it never adds twice. */
  createDepartment: async (name: string, idempotencyKey: string): Promise<Department> =>
    (
      await apiClient.post<Department>(
        `${BASE}/departments`,
        { name },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
        },
      )
    ).data,
  renameDepartment: async (departmentId: string, name: string, version: number): Promise<void> => {
    await apiClient.put(`${BASE}/departments/${enc(departmentId)}`, { name, version });
  },
  removeDepartment: async (departmentId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/departments/${enc(departmentId)}`);
  },
  createPosition: async (
    departmentId: string,
    title: string,
    idempotencyKey: string,
  ): Promise<StructurePosition> =>
    (
      await apiClient.post<StructurePosition>(
        `${BASE}/departments/${enc(departmentId)}/positions`,
        { title },
        { headers: { 'Idempotency-Key': idempotencyKey } },
      )
    ).data,
  renamePosition: async (positionId: string, title: string, version: number): Promise<void> => {
    await apiClient.put(`${BASE}/positions/${enc(positionId)}`, { title, version });
  },
  removePosition: async (positionId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/positions/${enc(positionId)}`);
  },
};
