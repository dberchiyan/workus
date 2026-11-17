import { z } from 'zod';

const envSchema = z.object({
    VITE_API_BASE_URL: z
        .union([z.literal(''), z.url({ protocol: /^https?$/ })])
        .default('')
        .transform((url) => url.replace(/\/+$/, '')),
    VITE_DEFAULT_LOCALE: z.enum(['en']).default('en'),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (source: Record<string, unknown>): Env => {
    const values = Object.fromEntries(
        Object.entries(source).map(([key, value]) => [key, value === '' ? undefined : value]),
    );
    const result = envSchema.safeParse(values);
    if (!result.success) {
        const problems = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
        throw new Error(`Invalid frontend environment (.env): ${problems}`);
    }
    return result.data;
};

export const env: Env = parseEnv({
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_DEFAULT_LOCALE: import.meta.env.VITE_DEFAULT_LOCALE,
});
