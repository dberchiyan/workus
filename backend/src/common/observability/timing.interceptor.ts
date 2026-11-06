import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { catchError, finalize, type Observable, throwError } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import type { RequestContext } from '../context/request-context';
import { ApiException } from '../exception/api.exception';
import { MetricsService } from './metrics.service';
import { DEFAULT_SLOW_THRESHOLD_MS, SLOW_THRESHOLD_KEY } from './slow-threshold.decorator';

/** Measures every request by route pattern, never by raw URL. */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly metrics: MetricsService,
    private readonly config: AppConfigService,
    private readonly cls: ClsService<RequestContext>,
    @InjectPinoLogger(TimingInterceptor.name) private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const threshold =
      this.reflector.get<number | undefined>(SLOW_THRESHOLD_KEY, context.getHandler()) ??
      DEFAULT_SLOW_THRESHOLD_MS;
    const started = process.hrtime.bigint();
    let failedStatus: number | undefined;

    return next.handle().pipe(
      catchError((error: unknown) => {
        failedStatus = statusOf(error);
        return throwError(() => error);
      }),
      finalize(() => {
        const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
        const pattern = this.routePattern(request);
        const route = `${request.method} ${pattern}`;
        const status = failedStatus ?? response.statusCode;
        this.metrics.httpRequestDuration.observe(
          { method: request.method, route: pattern, status: String(status) },
          durationMs / 1000,
        );
        const queryCount = this.config.get('DB_QUERY_LOG')
          ? (this.cls.get('queryCount') ?? 0)
          : undefined;
        const entry = {
          route,
          status,
          durationMs: Math.round(durationMs),
          ...(queryCount === undefined ? {} : { queryCount }),
        };
        if (durationMs > threshold) {
          this.logger.warn(entry, 'Slow request');
        } else {
          this.logger.info(entry, 'Request handled');
        }
      }),
    );
  }

  private routePattern(request: Request): string {
    const route: unknown = request.route;
    const path =
      typeof route === 'object' &&
      route !== null &&
      'path' in route &&
      typeof route.path === 'string'
        ? route.path
        : 'unmatched';
    return path;
  }
}

const statusOf = (error: unknown): number => {
  if (error instanceof ApiException) {
    return error.status;
  }
  if (error instanceof HttpException) {
    return error.getStatus();
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
};
