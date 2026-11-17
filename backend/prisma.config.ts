import { defineConfig, env } from 'prisma/config';

import { databaseUrl } from './src/common/config/database-url';

try {
    process.loadEnvFile('.env');
} catch {}

export default defineConfig({
    schema: 'prisma/schema',
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: databaseUrl({
            host: env('DATABASE_HOST'),
            port: Number(env('DATABASE_PORT')),
            name: env('DATABASE_NAME'),
            username: env('DATABASE_USERNAME'),
            password: env('DATABASE_PASSWORD'),
        }),
        ...(process.env.SHADOW_DATABASE_URL ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL } : {}),
    },
});
