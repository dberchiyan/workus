import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/features/auth';
import type { ApiError } from '@/shared/api/api-error';
import type { components } from '@/shared/types/api';

import { billingApi } from '../api/billing-api';
import type { Billing, BillingRedirect, ChangePlanRequest, CheckoutSessionRequest } from '../types';
import { billingKeys } from './query-keys';

const INFO_STALE_MS = Number.POSITIVE_INFINITY;

export const useBillingInfo = (): UseQueryResult<{ isTestMode: boolean }> =>
    useQuery({ queryKey: billingKeys.info(), queryFn: billingApi.info, staleTime: INFO_STALE_MS });

/** Fresh on every opening: the provider may have changed it (portal, failed payment). */
export const useBilling = (): UseQueryResult<{
    plan: components['schemas']['Plan_Output'];
    status: components['schemas']['SubscriptionStatus_Output'];
    scheduledPlan: components['schemas']['Plan_Output'] | null;
    periodEndsAt: string | null;
    pastDueAt: string | null;
    graceEndsAt: string | null;
    hasBillingAccount: boolean;
    isGrantedPlan: boolean;
    isTestMode: boolean;
    plans: components['schemas']['PlanOffer_Output'][];
}> =>
    useQuery({
        queryKey: billingKeys.summary(),
        queryFn: billingApi.summary,
        staleTime: 0,
        refetchOnMount: 'always',
    });

/** Money-moving: never optimistic. The answer sends the browser to the hosted checkout. */
export const useStartCheckout = (): UseMutationResult<
    { url: string },
    ApiError,
    { request: CheckoutSessionRequest; idempotencyKey: string }
> =>
    useMutation<BillingRedirect, ApiError, { request: CheckoutSessionRequest; idempotencyKey: string }>({
        mutationFn: ({ request, idempotencyKey }) => billingApi.startCheckout(request, idempotencyKey),
        onSuccess: ({ url }) => {
            window.location.assign(url);
        },
    });

export const useOpenPortal = (): UseMutationResult<{ url: string }, ApiError, void> =>
    useMutation<BillingRedirect, ApiError>({
        mutationFn: billingApi.openPortal,
        onSuccess: ({ url }) => {
            window.location.assign(url);
        },
    });

/** Money-moving (an upgrade is charged now): never optimistic. The plan's features follow. */
export const useChangePlan = (): UseMutationResult<
    {
        plan: components['schemas']['Plan_Output'];
        status: components['schemas']['SubscriptionStatus_Output'];
        scheduledPlan: components['schemas']['Plan_Output'] | null;
        periodEndsAt: string | null;
        pastDueAt: string | null;
        graceEndsAt: string | null;
        hasBillingAccount: boolean;
        isGrantedPlan: boolean;
        isTestMode: boolean;
        plans: components['schemas']['PlanOffer_Output'][];
    },
    ApiError,
    { plan: components['schemas']['Plan'] }
> => {
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
export const useSyncBilling = (): UseMutationResult<
    {
        plan: components['schemas']['Plan_Output'];
        status: components['schemas']['SubscriptionStatus_Output'];
        scheduledPlan: components['schemas']['Plan_Output'] | null;
        periodEndsAt: string | null;
        pastDueAt: string | null;
        graceEndsAt: string | null;
        hasBillingAccount: boolean;
        isGrantedPlan: boolean;
        isTestMode: boolean;
        plans: components['schemas']['PlanOffer_Output'][];
    },
    ApiError,
    void
> => {
    const queryClient = useQueryClient();
    return useMutation<Billing, ApiError>({
        mutationFn: billingApi.sync,
        onSuccess: async (billing) => {
            queryClient.setQueryData(billingKeys.summary(), billing);
            await queryClient.invalidateQueries({ queryKey: authKeys.me() });
        },
    });
};
