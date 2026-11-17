import { apiClient } from '@/shared/api/client';

import type { Billing, BillingInfo, BillingRedirect, ChangePlanRequest, CheckoutSessionRequest } from '../types';

const BASE = '/api/v1/billing';

/** The caller's company's subscription (owners) and the public billing mode. */
export const billingApi = {
    info: async (): Promise<BillingInfo> => (await apiClient.get<BillingInfo>(`${BASE}/info`)).data,
    summary: async (): Promise<Billing> => (await apiClient.get<Billing>(BASE)).data,
    /** The provider's hosted checkout for a paid plan; the browser goes to the URL. */
    startCheckout: async (request: CheckoutSessionRequest, idempotencyKey: string): Promise<BillingRedirect> =>
        (
            await apiClient.post<BillingRedirect>(`${BASE}/checkout-sessions`, request, {
                headers: { 'Idempotency-Key': idempotencyKey },
            })
        ).data,
    /** Upgrade (now), downgrade or cancel (at the period end), or keep the current plan. */
    changePlan: async (request: ChangePlanRequest): Promise<Billing> =>
        (await apiClient.put<Billing>(`${BASE}/plan`, request)).data,
    openPortal: async (): Promise<BillingRedirect> =>
        (await apiClient.post<BillingRedirect>(`${BASE}/portal-sessions`)).data,
    /** Re-reads the subscription from the provider (after a checkout). */
    sync: async (): Promise<Billing> => (await apiClient.post<Billing>(`${BASE}/sync`)).data,
};
