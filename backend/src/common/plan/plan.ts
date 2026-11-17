/**
 * The subscription plans (CONTEXT.md → Plans): what each one allows. One table for the server's
 * enforcement (PlanGuard, the employee limit) and the API's pricing data; the frontend mirrors
 * only what it needs to say "available on the Team plan" (features/auth/plan.ts).
 */
export const Plan = {
  STARTER: 'STARTER',
  TEAM: 'TEAM',
  BUSINESS: 'BUSINESS',
} as const;
export type Plan = (typeof Plan)[keyof typeof Plan];
export const PLANS = Object.values(Plan) as [Plan, ...Plan[]];
export const isPlan = (value: string): value is Plan =>
  (PLANS as readonly string[]).includes(value);

/** The plans a company pays for (Starter is free). */
export const PAID_PLANS = [Plan.TEAM, Plan.BUSINESS] as const satisfies readonly Plan[];
export type PaidPlan = (typeof PAID_PLANS)[number];
export const isPaidPlan = (plan: Plan): plan is PaidPlan =>
  (PAID_PLANS as readonly Plan[]).includes(plan);

/**
 * What a plan unlocks beyond the directory, time off and the company calendar (every plan has
 * those). Handlers that belong to a feature carry `@RequiresFeature(Feature.X)`.
 */
export const Feature = {
  /** Reviews and the salary history. */
  REVIEWS: 'reviews',
  /** Managing departments and positions (reading them is open: people are given positions). */
  STRUCTURE: 'structure',
  /** Yearly insights. */
  INSIGHTS: 'insights',
  /** Export of the change history and the security log. */
  EXPORTS: 'exports',
} as const;
export type Feature = (typeof Feature)[keyof typeof Feature];
export const FEATURES = Object.values(Feature) as [Feature, ...Feature[]];

export interface PlanOffer {
  plan: Plan;
  /** The product name (a proper noun, the same in every locale). */
  name: string;
  /** Monthly price in USD, a decimal string with four places (money is never a number). */
  monthlyPriceUsd: string;
  /** Employees the plan allows (active ones); null = unlimited. */
  maxEmployees: number | null;
  features: readonly Feature[];
}

/** Lowest plan first; a higher plan includes every lower plan's features. */
export const PLAN_CATALOGUE: Record<Plan, PlanOffer> = {
  STARTER: {
    plan: Plan.STARTER,
    name: 'Starter',
    monthlyPriceUsd: '0.0000',
    maxEmployees: 10,
    features: [],
  },
  TEAM: {
    plan: Plan.TEAM,
    name: 'Team',
    monthlyPriceUsd: '29.0000',
    maxEmployees: 50,
    features: [Feature.REVIEWS, Feature.STRUCTURE],
  },
  BUSINESS: {
    plan: Plan.BUSINESS,
    name: 'Business',
    monthlyPriceUsd: '79.0000',
    maxEmployees: null,
    features: [Feature.REVIEWS, Feature.STRUCTURE, Feature.INSIGHTS, Feature.EXPORTS],
  },
};

export const planIncludes = (plan: Plan, feature: Feature): boolean =>
  PLAN_CATALOGUE[plan].features.includes(feature);

/** The cheapest plan that has the feature — the upgrade hint names it. */
export const lowestPlanWith = (feature: Feature): Plan =>
  PLANS.find((plan) => planIncludes(plan, feature)) ?? Plan.BUSINESS;

/**
 * Days a company keeps its plan after a failed payment (product decision); then it is back on
 * Starter and the subscription is canceled.
 */
export const GRACE_PERIOD_DAYS = 7;
const DAY_MS = 86_400_000;
export const graceEndsAt = (pastDueSince: Date): Date =>
  new Date(pastDueSince.getTime() + GRACE_PERIOD_DAYS * DAY_MS);
