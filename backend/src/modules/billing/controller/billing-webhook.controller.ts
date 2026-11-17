import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { WebhookSignatureException } from '../../../common/exception/api.exception';
import { IdempotencyExempt } from '../../../common/idempotency/idempotent.decorator';
import { Public } from '../../../common/security/security.decorators';
import { BillingService } from '../service/billing.service';
import { WebhookReceiptResponse } from './dto/billing.response';

const SIGNATURE_HEADER = 'stripe-signature';

/**
 * Stripe's deliveries (integrations.md → Webhooks): public, authenticated by the signature over
 * the raw body (kept by main.ts for this path), the provider's event id the idempotency key.
 */
@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class BillingWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @Public()
  @IdempotencyExempt('The provider event id is the key: a repeated delivery is stored once')
  @ApiOperation({
    summary: 'Receive a Stripe event: verified by its signature, stored once, then applied',
  })
  @ZodResponse({ status: HttpStatus.OK, type: WebhookReceiptResponse })
  @ApiErrors('UNAUTHORIZED', 'MALFORMED_REQUEST', 'UNSUPPORTED_MEDIA_TYPE')
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers(SIGNATURE_HEADER) signature: string | undefined,
  ): Promise<WebhookReceiptResponse> {
    if (!request.rawBody) {
      // Nothing to verify a signature over.
      throw new WebhookSignatureException();
    }
    const { duplicate } = await this.billingService.receiveWebhook(request.rawBody, signature);
    return { received: true, duplicate };
  }
}
