import { z } from 'zod';

/**
 * The frontend's build-time configuration (`VITE_*`), checked once at start-up against a schema:
 * a wrong value stops the app with a message naming the variable, instead of failing later in
 * some request. Everything else reads `env`, never `import.meta.env`.
 */
const envSchema = z.object({
  /** API origin; empty = same origin (the dev proxy and the Docker nginx serve `/api`). */
  VITE_API_BASE_URL: z
    .union([z.literal(''), z.url({ protocol: /^https?$/ })])
    .default('')
    .transform((url) => url.replace(/\/+$/, '')),
  /** One of the supported locales. */
  VITE_DEFAULT_LOCALE: z.enum(['en']).default('en'),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (source: Record<string, unknown>): Env => {
  // Vite gives unset variables as undefined and empty ones as '' — both mean "default".
  const values = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === '' ? undefined : value]),
  );
  const result = envSchema.safeParse(values);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    // Configuration error for developers — not a user-facing string.
    throw new Error(`Invalid frontend environment (.env): ${problems}`);
  }
  return result.data;
};

export const env: Env = parseEnv({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_DEFAULT_LOCALE: import.meta.env.VITE_DEFAULT_LOCALE,
});
