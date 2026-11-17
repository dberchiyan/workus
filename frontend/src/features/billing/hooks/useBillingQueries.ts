import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth';
import type { ApiError } from '@/shared/api/apiError';
import { billingApi } from '../api/billingApi';
import type { Billing, BillingRedirect, ChangePlanRequest, CheckoutSessionRequest } from '../types';
import { billingKeys } from './queryKeys';

/** The billing mode never changes while the app runs. */
const INFO_STALE_MS = Number.POSITIVE_INFINITY;

export const useBillingInfo = () =>
    useQuery({ queryKey: billingKeys.info(), queryFn: billingApi.info, staleTime: INFO_STALE_MS });

/** Fresh on every opening: the provider may have changed it (portal, failed payment). */
export const useBilling = () =>
    useQuery({
        queryKey: billingKeys.summary(),
        queryFn: billingApi.summary,
        staleTime: 0,
        refetchOnMount: 'always',
    });

/** Money-moving: never optimistic. The answer sends the browser to the hosted checkout. */
export const useStartCheckout = () =>
    useMutation<BillingRedirect, ApiError, { request: CheckoutSessionRequest; idempotencyKey: string }>({
        mutationFn: ({ request, idempotencyKey }) => billingApi.startCheckout(request, idempotencyKey),
        onSuccess: ({ url }) => {
            window.location.assign(url);
        },
    });

export const useOpenPortal = () =>
    useMutation<BillingRedirect, ApiError>({
        mutationFn: billingApi.openPortal,
        onSuccess: ({ url }) => {
            window.location.assign(url);
        },
    });

/** Money-moving (an upgrade is charged now): never optimistic. The plan's features follow. */
export const useChangePlan = () => {
    const queryClient = useQueryClient();
    return useMutation<Billing, ApiError, ChangePlanRequest>({
        mutationFn: billingApi.changePlan,
        onSuccess: async (billing) => {
            queryClient.setQueryData(billingKeys.summary(), billing);
            await queryClient.invalidateQueries({ queryKey: authKeys.me() });
        },
    });
};

/** After a checkout: the plan and what it unlocks (in `/auth/me`) are re-read together. */
export const useSyncBilling = () => {
    const queryClient = useQueryClient();
    return useMutation<Billing, ApiError>({
        mutationFn: billingApi.sync,
        onSuccess: async (billing) => {
            queryClient.setQueryData(billingKeys.summary(), billing);
            await queryClient.invalidateQueries({ queryKey: authKeys.me() });
        },
    });
};
