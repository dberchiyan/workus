import { apiClient } from '@/shared/api/client';
import type { CreateHolidayRequest, Holiday, UpdateHolidayRequest } from '../types';

const BASE = '/api/v1/holidays';

export const holidaysApi = {
  year: async (year: number): Promise<Holiday[]> =>
    (await apiClient.get<{ content: Holiday[] }>(BASE, { params: { year } })).data.content,
  /** The key identifies one logical "add" — reused on retry so it never adds twice. */
  create: async (request: CreateHolidayRequest, idempotencyKey: string): Promise<Holiday> =>
    (
      await apiClient.post<Holiday>(BASE, request, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data,
  update: async (holidayId: string, request: UpdateHolidayRequest): Promise<Holiday> =>
    (await apiClient.put<Holiday>(`${BASE}/${encodeURIComponent(holidayId)}`, request)).data,
  remove: async (holidayId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${encodeURIComponent(holidayId)}`);
  },
};
