import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
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
import { ApiPageable, type Pageable, PageableQuery } from '../../../common/dto/pageable';
import { UuidParam } from '../../../common/dto/uuid-param';
import { SecurityLogQuery, toSecurityEventPage } from '../../../common/dto/security-event.response';
import { AUDIT_EVENT_PAGEABLE, type AuditEventSortField } from '../../audit/service/audit-sort';
import { AuthService } from '../service/auth.service';
import { SessionService } from '../service/session.service';
import { CurrentUserResponse } from './dto/current-user.response';
import { ChangePasswordRequest } from './dto/change-password.request';
import { LoginRequest } from './dto/login.request';
import {
  SESSIONS_PAGEABLE,
  type SessionSortField,
  SessionsResponse,
} from './dto/sessions.response';
import { SecurityLogResponse } from './dto/security-log.response';
import { toCurrentUserResponse } from './mapper/current-user.mapper';
import { toSessionsResponse } from './mapper/session.mapper';
import { SessionCookies } from '../../../common/security/session-cookies';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
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
    return toCurrentUserResponse(user, this.config.get('SESSION_IDLE_TIMEOUT_MINUTES'));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Authorize(can.ownAccount)
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
  @Authorize(can.ownAccount)
  @ApiOperation({ summary: 'Return the signed-in user' })
  @ZodResponse({ status: HttpStatus.OK, type: CurrentUserResponse })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED')
  async me(@CurrentPrincipal() principal: Principal): Promise<CurrentUserResponse> {
    return toCurrentUserResponse(
      await this.authService.currentUser(principal.userId),
      this.config.get('SESSION_IDLE_TIMEOUT_MINUTES'),
    );
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.ownAccount)
  @RateLimit(RateLimitName.PASSWORD_CHANGE)
  @ApiOperation({
    summary: 'Change own password; every session ends and this browser gets a new one',
  })
  @ApiErrors(
    'VALIDATION_FAILED',
    'UNAUTHORIZED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'BUSINESS_RULE_VIOLATION',
    'RATE_LIMIT_EXCEEDED',
  )
  async changePassword(
    @Body() request: ChangePasswordRequest,
    @CurrentPrincipal() principal: Principal,
    @Req() httpRequest: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const session = await this.authService.changePassword({
      userId: principal.userId,
      currentPassword: request.currentPassword,
      newPassword: request.newPassword,
      ip: clientIp(httpRequest),
      userAgent: clientUserAgent(httpRequest),
    });
    this.sessionCookies.write(response, session);
  }

  @Get('sessions')
  @Authorize(can.ownAccount)
  @ApiOperation({
    summary: "The caller's current session and a page of their other live sessions",
  })
  @ApiPageable(SESSIONS_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: SessionsResponse })
  @ApiErrors('INVALID_PARAMETER', 'UNAUTHORIZED', 'SESSION_EXPIRED')
  async sessions(
    @CurrentPrincipal() principal: Principal,
    @PageableQuery(SESSIONS_PAGEABLE) pageable: Pageable<SessionSortField>,
  ): Promise<SessionsResponse> {
    return toSessionsResponse(
      await this.sessionService.listForUser(principal.userId, principal.sessionId, pageable),
    );
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.ownAccount)
  @ApiOperation({ summary: 'Sign out everywhere except this session' })
  @ApiErrors('UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async endOtherSessions(@CurrentPrincipal() principal: Principal): Promise<void> {
    await this.authService.endOtherSessions(principal);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize(can.endOwnSession)
  @ApiOperation({ summary: 'End one of own sessions (this one signs out here)' })
  @ApiErrors('INVALID_PARAMETER', 'UNAUTHORIZED', 'SESSION_EXPIRED', 'FORBIDDEN')
  async endSession(
    @UuidParam('sessionId') sessionId: string,
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.endSession(principal, sessionId);
    if (sessionId === principal.sessionId) {
      this.sessionCookies.clear(response);
    }
  }

  @Get('security-log')
  @Authorize(can.ownAccount)
  @ApiOperation({
    summary:
      "The caller's security log: sign-ins, failed sign-ins, password changes, ended sessions",
  })
  @ApiPageable(AUDIT_EVENT_PAGEABLE)
  @ZodResponse({ status: HttpStatus.OK, type: SecurityLogResponse })
  @ApiErrors('INVALID_PARAMETER', 'UNAUTHORIZED', 'SESSION_EXPIRED')
  async securityLog(
    @CurrentPrincipal() principal: Principal,
    @Query() query: SecurityLogQuery,
    @PageableQuery(AUDIT_EVENT_PAGEABLE) pageable: Pageable<AuditEventSortField>,
  ): Promise<SecurityLogResponse> {
    return toSecurityEventPage(
      await this.authService.securityLog(principal, query.category ?? null, pageable),
    );
  }
}
