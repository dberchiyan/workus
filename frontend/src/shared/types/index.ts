import type { components, operations } from './api';

export type Schemas = components['schemas'];
export type Operations = operations;
export type ErrorCode = Schemas['ErrorCode'];
export type ErrorResponse = Schemas['ErrorResponse'];
