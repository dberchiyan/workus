const DEFAULT_API_PORT = 3100;
const DEFAULT_WEB_PORT = 4173;

const port = (value: string | undefined, fallback: number): number => (value ? Number(value) : fallback);

export const API_PORT = port(process.env.E2E_API_PORT, DEFAULT_API_PORT);
export const WEB_PORT = port(process.env.E2E_WEB_PORT, DEFAULT_WEB_PORT);
export const API_URL = `http://localhost:${API_PORT}`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
export const DATABASE_NAME = process.env.E2E_DATABASE_NAME ?? 'workus_e2e';

const PASSED_THROUGH = ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'] as const;

/**
 * The backend's environment for the test stack. Values set here win over `backend/.env` (runtime variables take
 * precedence), so a developer's settings never leak in; database credentials come from the environment in CI and
 * from `backend/.env` locally.
 */
export const backendEnv = (): Record<string, string> => {
    const credentials = Object.fromEntries(
        PASSED_THROUGH.flatMap((key) => {
            const value = process.env[key];
            return value ? [[key, value]] : [];
        }),
    );
    return {
        ...credentials,
        APP_ENV: 'dev',
        NODE_ENV: 'development',
        PORT: String(API_PORT),
        TZ: 'UTC',
        DATABASE_NAME,
        DB_POOL_SIZE: '10',
        DB_QUERY_LOG: 'false',
        TRUST_PROXY_HOPS: '0',
        SESSION_COOKIE_NAME: 'workus_session',
        COOKIE_SECURE: 'false',
        COOKIE_SAME_SITE: 'lax',
        SESSION_IDLE_TIMEOUT_MINUTES: '60',
        SESSION_ABSOLUTE_TIMEOUT_MINUTES: '1440',
        CORS_ALLOWED_ORIGINS: WEB_URL,
        SUPPORTED_LOCALES: 'en',
        DEMO_MODE: 'false',
        APP_URL: WEB_URL,
        BILLING_PROVIDER: 'fake',
    };
};
