import type { AxiosResponse } from 'axios';
import i18n from 'i18next';
import type { z } from 'zod';
import { ApiContractError } from './apiError';
import { RESPONSE_SCHEMAS } from './schemas.generated';

/** How many mismatches an error lists (keeps it readable). */
const MAX_ISSUES = 5;

/** The schema the contract gives for this call; undefined when it answers no JSON. */
const schemaFor = (method: string | undefined, url: string | undefined): z.ZodType | undefined => {
  if (!url) {
    return undefined;
  }
  // The path only: query strings travel in `params`, but be safe if one is in the URL.
  const path = new URL(url, 'http://contract.local').pathname;
  const verb = (method ?? 'get').toLowerCase();
  return RESPONSE_SCHEMAS.find((entry) => entry.method === verb && entry.pattern.test(path))
    ?.schema;
};

/**
 * Checks a successful response against the OpenAPI contract (generated Zod schemas) and
 * returns it with the parsed body (unknown keys stripped). A body that breaks the contract is
 * rejected as an `ApiContractError` (never retried) — the view shows its error state instead of rendering wrong data.
 */
export const checkResponseContract = (response: AxiosResponse): AxiosResponse => {
  const schema = schemaFor(response.config.method, response.config.url);
  if (!schema || response.status === 204) {
    return response;
  }
  const result = schema.safeParse(response.data);
  if (result.success) {
    response.data = result.data;
    return response;
  }
  throw new ApiContractError(
    response.status,
    i18n.t('errors:CONTRACT_MISMATCH'),
    result.error.issues.slice(0, MAX_ISSUES).map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  );
};
