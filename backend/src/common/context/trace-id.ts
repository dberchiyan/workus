import { randomBytes } from 'node:crypto';

export const TRACE_ID_HEADER = 'X-Trace-Id';

export const generateTraceId = (): string => randomBytes(8).toString('hex');
