import { HttpStatus, Injectable, type OnApplicationBootstrap, RequestMethod } from '@nestjs/common';
import { HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { IDEMPOTENCY_EXEMPT_KEY, IDEMPOTENT_KEY } from '../idempotency/idempotent.decorator';
import type { Policy } from './policy';
import { POLICY_KEY, PUBLIC_KEY } from './security.decorators';

type MetadataTarget = Parameters<Reflector['get']>[1];

const PATH_ID_PARAM = /:([A-Za-z]+Id)\b/g;

/** Refuses to boot when a handler breaks the security contract (security.md). */
@Injectable()
export class RouteAuditService implements OnApplicationBootstrap {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onApplicationBootstrap(): void {
    const violations: string[] = [];
    for (const wrapper of this.discovery.getControllers()) {
      const instance: unknown = wrapper.instance;
      if (typeof instance !== 'object' || instance === null) {
        continue;
      }
      const prototype: object = Object.getPrototypeOf(instance) as object;
      const controllerPath = this.pathOf(wrapper.metatype);
      for (const methodName of this.scanner.getAllMethodNames(prototype)) {
        const handler: unknown = Reflect.get(prototype, methodName);
        if (typeof handler !== 'function') {
          continue;
        }
        const method = this.reflector.get<RequestMethod | undefined>(METHOD_METADATA, handler);
        if (method === undefined) {
          continue;
        }
        const route = `${RequestMethod[method]} /${[controllerPath, this.pathOf(handler)].filter(Boolean).join('/')}`;
        violations.push(...this.audit(handler, method, route));
      }
    }
    if (violations.length > 0) {
      throw new Error(`Route audit failed:\n${violations.join('\n')}`);
    }
  }

  private audit(handler: MetadataTarget, method: RequestMethod, route: string): string[] {
    const violations: string[] = [];
    const isPublic = this.reflector.get<boolean | undefined>(PUBLIC_KEY, handler) === true;
    const requiredPolicy = this.reflector.get<Policy | undefined>(POLICY_KEY, handler);
    if (isPublic === (requiredPolicy !== undefined)) {
      violations.push(`${route}: needs exactly one of @Public() / @Authorize()`);
    }
    for (const match of route.matchAll(PATH_ID_PARAM)) {
      const param = match[1];
      if (param && !requiredPolicy?.params.includes(param)) {
        violations.push(`${route}: path parameter ${param} is not checked by the policy`);
      }
    }
    if (
      method === RequestMethod.POST &&
      this.reflector.get<number | undefined>(HTTP_CODE_METADATA, handler) !== HttpStatus.OK
    ) {
      violations.push(`${route}: POST needs @HttpCode(HttpStatus.OK)`);
    }
    if (
      method === RequestMethod.POST &&
      this.reflector.get<boolean | undefined>(IDEMPOTENT_KEY, handler) !== true &&
      this.reflector.get<string | undefined>(IDEMPOTENCY_EXEMPT_KEY, handler) === undefined
    ) {
      violations.push(`${route}: POST needs @Idempotent() or @IdempotencyExempt(reason)`);
    }
    return violations;
  }

  private pathOf(target: unknown): string {
    if (typeof target !== 'function') {
      return '';
    }
    const path = this.reflector.get<string | string[] | undefined>(PATH_METADATA, target);
    const value = Array.isArray(path) ? path.join(',') : (path ?? '');
    return value.replace(/^\/+|\/+$/g, '');
  }
}
