import { z } from 'zod';

import { FEATURES, PLANS } from '../plan/plan';

/** Shared by the signed-in user (what is unlocked) and the billing page (the plans). */
export const PlanSchema = z.enum(PLANS).meta({ id: 'Plan' });
export const FeatureSchema = z.enum(FEATURES).meta({ id: 'PlanFeature' });
