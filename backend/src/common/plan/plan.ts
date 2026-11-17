export const Plan = {
    STARTER: 'STARTER',
    TEAM: 'TEAM',
    BUSINESS: 'BUSINESS',
} as const;
export type Plan = (typeof Plan)[keyof typeof Plan];
export const PLANS = Object.values(Plan) as [Plan, ...Plan[]];
export const isPlan = (value: string): value is Plan => (PLANS as readonly string[]).includes(value);

export const PAID_PLANS = [Plan.TEAM, Plan.BUSINESS] as const satisfies readonly Plan[];
export type PaidPlan = (typeof PAID_PLANS)[number];
export const isPaidPlan = (plan: Plan): plan is PaidPlan => (PAID_PLANS as readonly Plan[]).includes(plan);

export const Feature = {
    REVIEWS: 'reviews',
    STRUCTURE: 'structure',
    INSIGHTS: 'insights',
    EXPORTS: 'exports',
} as const;
export type Feature = (typeof Feature)[keyof typeof Feature];
export const FEATURES = Object.values(Feature) as [Feature, ...Feature[]];

export interface PlanOffer {
    plan: Plan;
    name: string;
    monthlyPriceUsd: string;
    maxEmployees: number | null;
    features: readonly Feature[];
}

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

export const planIncludes = (plan: Plan, feature: Feature): boolean => PLAN_CATALOGUE[plan].features.includes(feature);

/** The cheapest plan that has the feature — the upgrade hint names it. */
export const lowestPlanWith = (feature: Feature): Plan =>
    PLANS.find((plan) => planIncludes(plan, feature)) ?? Plan.BUSINESS;

export const GRACE_PERIOD_DAYS = 7;
const DAY_MS = 86_400_000;
export const graceEndsAt = (pastDueAt: Date): Date => new Date(pastDueAt.getTime() + GRACE_PERIOD_DAYS * DAY_MS);
