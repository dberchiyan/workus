import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import i18n from 'i18next';
import { env } from '@/shared/config/env';
import type { ErrorCode, ErrorResponse } from '@/shared/types';
import { ApiError } from './apiError';
import { checkResponseContract } from './responseContract';

const TIMEOUT_MS = 15_000;
const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';
const SAFE_METHODS = new Set(['get', 'head', 'options']);
const SESSION_ERRORS: ReadonlySet<ErrorCode> = new Set(['UNAUTHORIZED', 'SESSION_EXPIRED']);

const readCookie = (name: string): string | undefined =>
  document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);

const isErrorResponse = (data: unknown): data is ErrorResponse =>
  typeof data === 'object' &&
  data !== null &&
  'error' in data &&
  'status' in data &&
  'message' in data &&
  typeof data.error === 'string' &&
  typeof data.status === 'number' &&
  typeof data.message === 'string';

type SessionLostHandler = (code: ErrorCode, config: InternalAxiosRequestConfig | undefined) => void;
let onSessionLost: SessionLostHandler | undefined;

/** Registered once by the app shell: 401 mid-session → clear cache, go to sign-in. */
export const setSessionLostHandler = (handler: SessionLostHandler): void => {
  onSessionLost = handler;
};

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', i18n.resolvedLanguage ?? i18n.language);
  if (!SAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) {
      config.headers.set(CSRF_HEADER, decodeURIComponent(csrfToken));
    }
  }
  return config;
});

// Every JSON answer is checked against the contract the types come from (runtime safety net).
apiClient.interceptors.response.use(checkResponseContract, (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return Promise.reject(error instanceof Error ? error : new Error('Unknown error'));
  }
  const data: unknown = error.response?.data;
  if (!error.response || !isErrorResponse(data)) {
    const status = error.response?.status ?? 0;
    const code: ErrorCode = status === 0 ? 'UPSTREAM_UNAVAILABLE' : 'INTERNAL_ERROR';
    return Promise.reject(new ApiError(status, code, i18n.t(`errors:${code}`), [], undefined));
  }
  const apiError = ApiError.fromResponse(data);
  if (apiError.status === 401 && SESSION_ERRORS.has(apiError.code)) {
    onSessionLost?.(apiError.code, error.config);
  }
  return Promise.reject(apiError);
});
