import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { IDEMPOTENCY_HEADER, IdempotencyExempt, Idempotent } from '../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { Authorize, Public } from '../../../common/security/security.decorators';
import { BillingService } from '../service/billing.service';
import {
    BillingInfoResponse,
    BillingRedirectResponse,
    BillingResponse,
    ChangePlanRequest,
    CheckoutSessionRequest,
} from './dto/billing.response';
import { toBillingResponse } from './mapper/billing.mapper';

/** The caller's company's plan and subscription (owners), and the public billing mode. */
@ApiTags('Billing')
@Controller('api/v1/billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) {}

    @Get('info')
    @Public()
    @ApiOperation({ summary: 'Whether payments run in test mode (shown on the sign-in page)' })
    @ZodResponse({ status: HttpStatus.OK, type: BillingInfoResponse })
    @ApiErrors('RATE_LIMIT_EXCEEDED')
    info(): BillingInfoResponse {
        return this.billingService.info();
    }

    @Get()
    @Authorize(can.manageBilling)
    @ApiOperation({ summary: "The company's plan, subscription state and the plans on offer" })
    @ZodResponse({ status: HttpStatus.OK, type: BillingResponse })
    @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
    async summary(@CurrentPrincipal() principal: Principal): Promise<BillingResponse> {
        return toBillingResponse(await this.billingService.summary(principal.organisationId));
    }

    @Post('checkout-sessions')
    @HttpCode(HttpStatus.OK)
    @Authorize(can.manageBilling)
    @Idempotent()
    @ApiOperation({
        summary: 'Start the hosted checkout for a paid plan (charged at once); answers its URL',
    })
    @ZodResponse({ status: HttpStatus.OK, type: BillingRedirectResponse })
    @ApiErrors(
        'VALIDATION_FAILED',
        'INVALID_PARAMETER',
        'UNAUTHORIZED',
        'SESSION_EXPIRED',
        'FORBIDDEN',
        'IDEMPOTENCY_KEY_REUSED',
        'BUSINESS_RULE_VIOLATION',
        'UPSTREAM_UNAVAILABLE',
    )
    startCheckout(
        @Body() request: CheckoutSessionRequest,
        @CurrentPrincipal() principal: Principal,
        @Headers(IDEMPOTENCY_HEADER) idempotencyKey: string,
    ): Promise<BillingRedirectResponse> {
        return this.billingService.startCheckout(principal, request.plan, idempotencyKey);
    }

    @Put('plan')
    @Authorize(can.manageBilling)
    @ApiOperation({
        summary:
            'Change the plan: a higher one applies now (charged at once), a lower one at the period end, Starter cancels; the current one keeps it',
    })
    @ZodResponse({ status: HttpStatus.OK, type: BillingResponse })
    @ApiErrors(
        'VALIDATION_FAILED',
        'UNAUTHORIZED',
        'SESSION_EXPIRED',
        'FORBIDDEN',
        'BUSINESS_RULE_VIOLATION',
        'UPSTREAM_UNAVAILABLE',
    )
    async changePlan(
        @Body() request: ChangePlanRequest,
        @CurrentPrincipal() principal: Principal,
    ): Promise<BillingResponse> {
        return toBillingResponse(await this.billingService.changePlan(principal, request.plan));
    }

    @Post('portal-sessions')
    @HttpCode(HttpStatus.OK)
    @Authorize(can.manageBilling)
    @IdempotencyExempt('A portal link is short-lived; a repeat only makes another')
    @ApiOperation({
        summary: 'Open the billing portal (card, invoices, plan changes, cancellation); answers its URL',
    })
    @ZodResponse({ status: HttpStatus.OK, type: BillingRedirectResponse })
    @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN', 'BUSINESS_RULE_VIOLATION', 'UPSTREAM_UNAVAILABLE')
    openPortal(@CurrentPrincipal() principal: Principal): Promise<BillingRedirectResponse> {
        return this.billingService.openPortal(principal.organisationId);
    }

    @Post('sync')
    @HttpCode(HttpStatus.OK)
    @Authorize(can.manageBilling)
    @IdempotencyExempt('Re-reads the subscription from the provider; a repeat changes nothing')
    @ApiOperation({
        summary: "Re-read the company's subscription from the provider (after a checkout) and answer the state",
    })
    @ZodResponse({ status: HttpStatus.OK, type: BillingResponse })
    @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN', 'UPSTREAM_UNAVAILABLE')
    async sync(@CurrentPrincipal() principal: Principal): Promise<BillingResponse> {
        return toBillingResponse(await this.billingService.sync(principal.organisationId));
    }
}
