import { type CanActivate, type ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

import type { RequestContext } from '../context/request-context';
import { PlanUpgradeRequiredException } from '../exception/api.exception';
import { type Feature, lowestPlanWith, planIncludes } from '../plan/plan';

export const REQUIRED_FEATURE_KEY = 'security:required-feature';

/**
 * The handler belongs to a plan feature (common/plan): a company whose plan lacks it gets 403
 * PLAN_UPGRADE_REQUIRED naming the cheapest plan that has it. Enforced here, not only hidden in
 * the UI. Runs after authorisation, so a foreign id still answers 404 first.
 */
export const RequiresFeature = (feature: Feature): MethodDecorator => SetMetadata(REQUIRED_FEATURE_KEY, feature);

@Injectable()
export class PlanGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly cls: ClsService<RequestContext>,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const feature = this.reflector.get<Feature | undefined>(REQUIRED_FEATURE_KEY, context.getHandler());
        const principal = this.cls.get('principal');
        // No principal: the authorisation guard has already refused (or the route is public).
        if (feature === undefined || !principal) {
            return true;
        }
        if (!planIncludes(principal.plan, feature)) {
            throw new PlanUpgradeRequiredException(feature, lowestPlanWith(feature));
        }
        return true;
    }
}
