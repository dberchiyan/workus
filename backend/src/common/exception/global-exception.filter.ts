import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  ForbiddenException,
  HttpException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import type { I18nTranslations } from '../../generated/i18n.generated';
import type { RequestContext } from '../context/request-context';
import type { ErrorResponse } from '../dto/error.response';
import { FALLBACK_LOCALE } from '../i18n/i18n.module';
import type { I18nPath } from '../i18n/i18n-path';
import { classifyPrismaError, PrismaErrorKind } from '../persistence/prisma-error';
import { ApiException, type MessageArgs, RateLimitExceededException } from './api.exception';
import { ErrorCode } from './error-code';

interface ResolvedError {
  code: ErrorCode;
  messageKey: I18nPath;
  args: MessageArgs;
  details?: { field: string; message: string }[];
}

const VALIDATION_KEY_PREFIX = 'validation.';

/** Body-parser errors carry a `type` and arrive before any Nest handler runs. */
const bodyParserErrorType = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('type' in error)) {
    return undefined;
  }
  return typeof error.type === 'string' ? error.type : undefined;
};

/** Writes every error response — one shape for framework, security and business errors. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly cls: ClsService<RequestContext>,
    @InjectPinoLogger(GlobalExceptionFilter.name) private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const lang = I18nContext.current()?.lang ?? FALLBACK_LOCALE;
    const resolved = this.resolve(exception, lang);
    const status = ErrorCode[resolved.code];
    const traceId = this.cls.isActive() ? this.cls.getId() : 'none';

    if (resolved.code === 'INTERNAL_ERROR') {
      this.logger.error({ err: exception, traceId }, 'Unhandled error');
    } else {
      this.logger.warn({ code: resolved.code, traceId }, 'Request failed');
    }

    if (exception instanceof RateLimitExceededException) {
      response.setHeader('Retry-After', String(exception.retryAfterSeconds));
    }

    const body: ErrorResponse = {
      timestamp: new Date().toISOString(),
      status,
      error: resolved.code,
      message: this.i18n.t(resolved.messageKey, { lang, args: resolved.args }),
      path: request.originalUrl.split('?')[0] ?? request.path,
      traceId,
      ...(resolved.details ? { details: resolved.details } : {}),
    };
    response.status(status).json(body);
  }

  private resolve(exception: unknown, lang: string): ResolvedError {
    if (exception instanceof ApiException) {
      const resolved: ResolvedError = {
        code: exception.code,
        messageKey: exception.messageKey,
        args: exception.args,
      };
      const field =
        'field' in exception && typeof exception.field === 'string' ? exception.field : undefined;
      return field
        ? {
            ...resolved,
            details: [
              { field, message: this.i18n.t(exception.messageKey, { lang, args: exception.args }) },
            ],
          }
        : resolved;
    }
    if (exception instanceof ZodValidationException) {
      return {
        code: 'VALIDATION_FAILED',
        messageKey: 'errors.VALIDATION_FAILED',
        args: {},
        details: this.toDetails(exception.getZodError(), lang),
      };
    }
    const parserErrorType = bodyParserErrorType(exception);
    if (parserErrorType === 'entity.parse.failed') {
      return simple('MALFORMED_REQUEST');
    }
    if (parserErrorType === 'entity.too.large' || exception instanceof PayloadTooLargeException) {
      return simple('PAYLOAD_TOO_LARGE');
    }
    if (exception instanceof NotFoundException) {
      return simple('RESOURCE_NOT_FOUND');
    }
    if (exception instanceof ForbiddenException) {
      return simple('FORBIDDEN');
    }
    switch (classifyPrismaError(exception)) {
      case PrismaErrorKind.UNIQUE_VIOLATION:
      case PrismaErrorKind.FOREIGN_KEY_VIOLATION:
        return simple('CONFLICT');
      case PrismaErrorKind.NOT_FOUND:
        return simple('RESOURCE_NOT_FOUND');
      case undefined:
        break;
    }
    if (exception instanceof HttpException && exception.getStatus() === 400) {
      return simple('MALFORMED_REQUEST');
    }
    return simple('INTERNAL_ERROR');
  }

  private toDetails(error: unknown, lang: string): { field: string; message: string }[] {
    if (!(error instanceof ZodError)) {
      return [];
    }
    return error.issues.map((issue) => {
      const key: I18nPath = issue.message.startsWith(VALIDATION_KEY_PREFIX)
        ? (issue.message as I18nPath)
        : 'validation.invalid';
      // Limits a message may name: {max} for too long / too many, {min} for too short.
      const args = {
        ...('maximum' in issue ? { max: Number(issue.maximum) } : {}),
        ...('minimum' in issue ? { min: Number(issue.minimum) } : {}),
      };
      return { field: issue.path.join('.'), message: this.i18n.t(key, { lang, args }) };
    });
  }
}

const simple = (code: ErrorCode): ResolvedError => ({
  code,
  messageKey: `errors.${code}`,
  args: {},
});
