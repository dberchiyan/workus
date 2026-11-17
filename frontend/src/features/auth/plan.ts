import type { CurrentUser } from './types';

export type Plan = CurrentUser['organisation']['billing']['plan'];
export type PlanFeature = CurrentUser['organisation']['billing']['features'][number];

/**
 * Mirrors backend/src/common/plan/plan.ts (the catalogue): the cheapest plan that has each
 * feature, so an upgrade prompt can name it without a request. Prices and limits are never
 * mirrored — the billing page reads them from the API.
 */
export const PLAN_FOR_FEATURE: Record<PlanFeature, Plan> = {
  reviews: 'TEAM',
  structure: 'TEAM',
  insights: 'BUSINESS',
  exports: 'BUSINESS',
};
