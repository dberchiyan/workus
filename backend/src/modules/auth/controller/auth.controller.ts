import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { AppConfigService } from '../../../common/config/app-config.service';
import { ApiErrors } from '../../../common/exception/api-errors.decorator';
import { IdempotencyExempt } from '../../../common/idempotency/idempotent.decorator';
import { CurrentPrincipal } from '../../../common/security/current-principal.decorator';
import { can } from '../../../common/security/policies';
import type { Principal } from '../../../common/security/principal';
import { RateLimit, RateLimitName } from '../../../common/security/rate-limit';
import { clientIp, clientUserAgent, readCookie } from '../../../common/security/request-client';
import { Authorize, Public } from '../../../common/security/security.decorators';
import { AuthService } from '../service/auth.service';
import { CurrentUserResponse } from './dto/current-user.response';
import { LoginRequest } from './dto/login.request';
import { toCurrentUserResponse } from './mapper/current-user.mapper';
import { SessionCookies } from './session-cookies';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionCookies: SessionCookies,
    private readonly config: AppConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  @IdempotencyExempt('No session yet; a repeat only replaces the session')
  @RateLimit(RateLimitName.LOGIN)
  @ApiOperation({ summary: 'Sign in with email and password and start a session' })
  @ZodResponse({ status: HttpStatus.OK, type: CurrentUserResponse })
  @ApiErrors(
    'VALIDATION_FAILED',
    'MALFORMED_REQUEST',
    'INVALID_CREDENTIALS',
    'ACCESS_ENDED',
    'FORBIDDEN',
    'RATE_LIMIT_EXCEEDED',
  )
  async login(
    @Body() request: LoginRequest,
    @Req() httpRequest: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CurrentUserResponse> {
    const { user, session } = await this.authService.login({
      email: request.email,
      password: request.password,
      ip: clientIp(httpRequest),
      userAgent: clientUserAgent(httpRequest),
      presentedToken: readCookie(httpRequest, this.config.get('SESSION_COOKIE_NAME')),
    });
    this.sessionCookies.write(response, session);
    return toCurrentUserResponse(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.authenticated)
  @IdempotencyExempt('Deleting the session is idempotent by nature')
  @ApiOperation({ summary: 'End the current session' })
  @ApiOkResponse({ description: 'Session ended; cookies cleared' })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async logout(
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(principal);
    this.sessionCookies.clear(response);
  }

  @Get('me')
  @Authorize(can.authenticated)
  @ApiOperation({ summary: 'Return the signed-in user' })
  @ZodResponse({ status: HttpStatus.OK, type: CurrentUserResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED')
  async me(@CurrentPrincipal() principal: Principal): Promise<CurrentUserResponse> {
    return toCurrentUserResponse(await this.authService.currentUser(principal.userId));
  }
}
