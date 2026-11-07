import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { AppConfigService } from '../../../common/config/app-config.service';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { IdempotencyExempt } from '../../../common/idempotency/idempotent.decorator';
import { RateLimit, RateLimitName } from '../../../common/security/rate-limit';
import { clientIp, clientUserAgent, readCookie } from '../../../common/security/request-client';
import { Public } from '../../../common/security/security.decorators';
import { SessionCookies } from '../../../common/security/session-cookies';
import { OrganisationService } from '../service/organisation.service';
import { OrganisationResponse } from './dto/organisation.response';
import { RegistrationRequest } from './dto/registration.request';
import { toOrganisationResponse } from './mapper/organisation.mapper';

@ApiTags('Organisation')
@Controller('api/v1/registrations')
export class RegistrationController {
  constructor(
    private readonly organisationService: OrganisationService,
    private readonly sessionCookies: SessionCookies,
    private readonly config: AppConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Public()
  @IdempotencyExempt(
    'No session yet; a repeat is refused on the taken email (409), never creates twice',
  )
  @RateLimit(RateLimitName.REGISTRATION)
  @ApiOperation({
    summary: 'Register a company: create the organisation and its owner, and sign the owner in',
  })
  @ZodResponse({ status: HttpStatus.OK, type: OrganisationResponse })
  @ApiErrors('VALIDATION_FAILED', 'MALFORMED_REQUEST', 'CONFLICT', 'RATE_LIMIT_EXCEEDED')
  async register(
    @Body() request: RegistrationRequest,
    @Req() httpRequest: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<OrganisationResponse> {
    const { organisation, session } = await this.organisationService.register({
      organisationName: request.organisationName,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      password: request.password,
      ip: clientIp(httpRequest),
      userAgent: clientUserAgent(httpRequest),
      presentedToken: readCookie(httpRequest, this.config.get('SESSION_COOKIE_NAME')),
    });
    this.sessionCookies.write(response, session);
    return toOrganisationResponse(organisation);
  }
}
