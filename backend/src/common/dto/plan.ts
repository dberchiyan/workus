import { z } from 'zod';

import { FEATURES, PLANS } from '../plan/plan';

export const PlanSchema = z.enum(PLANS).meta({ id: 'Plan' });
export const FeatureSchema = z.enum(FEATURES).meta({ id: 'PlanFeature' });
