import { createHash } from 'node:crypto';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { catchError, from, type Observable, of, switchMap, throwError } from 'rxjs';
import type { RequestContext } from '../context/request-context';
import {
  IdempotencyKeyReusedException,
  InvalidParameterException,
  NotAuthenticatedException,
  RequestInProgressException,
} from '../exception/api.exception';
import { MetricsService } from '../observability/metrics.service';
import { IdempotencyKeyStore } from '../persistence/idempotency-key.store';
import { IDEMPOTENCY_HEADER, IDEMPOTENT_KEY } from './idempotent.decorator';

const KEY_TTL_MS = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const endpointOf = (request: Request): string => {
  const route: unknown = request.route;
  const path =
    typeof route === 'object' && route !== null && 'path' in route && typeof route.path === 'string'
      ? route.path
      : request.path;
  return `${request.method} ${path}`.slice(0, 255);
};

/** api.md → Idempotency: claim before executing, store after, replay on repeat. */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly store: IdempotencyKeyStore,
    private readonly cls: ClsService<RequestContext>,
    private readonly metrics: MetricsService,
    @InjectPinoLogger(IdempotencyInterceptor.name) private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (this.reflector.get<boolean | undefined>(IDEMPOTENT_KEY, context.getHandler()) !== true) {
      return next.handle();
    }
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const key = request.get(IDEMPOTENCY_HEADER);
    if (!key || !UUID.test(key)) {
      throw new InvalidParameterException(IDEMPOTENCY_HEADER);
    }
    const principal = this.cls.get('principal');
    if (!principal) {
      throw new NotAuthenticatedException();
    }
    const endpoint = endpointOf(request);
    const requestHash = createHash('sha256')
      .update(`${endpoint}\n${JSON.stringify(request.body ?? null)}`)
      .digest('hex');

    return from(
      this.store.claim({
        key: key.toLowerCase(),
        userId: principal.userId,
        endpoint,
        requestHash,
        expiresAt: new Date(Date.now() + KEY_TTL_MS),
      }),
    ).pipe(
      switchMap((claim) => {
        switch (claim.outcome) {
          case 'REPLAY':
            this.logger.info({ endpoint }, 'Idempotent replay');
            response.status(claim.response.statusCode);
            return of(claim.response.body);
          case 'REUSED':
            this.metrics.idempotencyCollisions.inc({ reason: 'reused' });
            return throwError(() => new IdempotencyKeyReusedException());
          case 'IN_PROGRESS':
            this.metrics.idempotencyCollisions.inc({ reason: 'in_progress' });
            return throwError(() => new RequestInProgressException());
          case 'CLAIMED':
            return next.handle().pipe(
              switchMap((body: unknown) =>
                from(this.store.complete(claim.id, { statusCode: response.statusCode, body })).pipe(
                  switchMap(() => of(body)),
                ),
              ),
              catchError((error: unknown) =>
                from(this.store.release(claim.id)).pipe(switchMap(() => throwError(() => error))),
              ),
            );
        }
      }),
    );
  }
}
