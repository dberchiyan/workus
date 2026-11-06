import { defineConfig, env } from 'prisma/config';
import { databaseUrl } from './src/common/config/database-url';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: variables come from the environment (CI, deployed runtime).
}

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
    // Needed only by `db:check` and `db:migrate:dev` (local); never used at runtime.
    ...(process.env.SHADOW_DATABASE_URL
      ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
      : {}),
  },
});
