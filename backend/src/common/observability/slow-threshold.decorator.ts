import { SetMetadata } from '@nestjs/common';

export const SLOW_THRESHOLD_KEY = 'observability:slow-threshold';
export const DEFAULT_SLOW_THRESHOLD_MS = 1000;

export const SlowThreshold = (milliseconds: number): MethodDecorator =>
  SetMetadata(SLOW_THRESHOLD_KEY, milliseconds);
