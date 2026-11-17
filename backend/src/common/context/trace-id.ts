import { randomBytes } from 'node:crypto';

export const TRACE_ID_HEADER = 'X-Trace-Id';

const TRACE_ID_BYTES = 8;

export const generateTraceId = (): string => randomBytes(TRACE_ID_BYTES).toString('hex');
