import type { components, operations } from './api';

/** Aliases over generated OpenAPI types — never hand-written shapes. */
export type Schemas = components['schemas'];
export type Operations = operations;
export type ErrorCode = Schemas['ErrorCode'];
export type ErrorResponse = Schemas['ErrorResponse'];
