import type { CurrentUser } from './types';

export type Plan = CurrentUser['organisation']['billing']['plan'];
export type PlanFeature = CurrentUser['organisation']['billing']['features'][number];

export const PLAN_FOR_FEATURE: Record<PlanFeature, Plan> = {
    reviews: 'TEAM',
    structure: 'TEAM',
    insights: 'BUSINESS',
    exports: 'BUSINESS',
};
