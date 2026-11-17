/** Mirrored by ck_organisations_subscription_status. */
export const SubscriptionStatus = {
  NONE: 'NONE',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
} as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const SUBSCRIPTION_STATUSES = Object.values(SubscriptionStatus) as [
  SubscriptionStatus,
  ...SubscriptionStatus[],
];

export const isSubscriptionStatus = (value: string): value is SubscriptionStatus =>
  (SUBSCRIPTION_STATUSES as readonly string[]).includes(value);
