import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { UnsupportedMediaTypeException } from '../exception/api.exception';

/** Only JSON bodies are accepted; anything else is 415 (api.md). */
@Injectable()
export class JsonOnlyMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    const hasBody =
      request.get('transfer-encoding') !== undefined ||
      Number(request.get('content-length') ?? '0') > 0;
    if (hasBody && request.is('application/json') === false) {
      throw new UnsupportedMediaTypeException();
    }
    next();
  }
}
