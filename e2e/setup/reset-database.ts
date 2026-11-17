import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { backendEnv, DATABASE_NAME } from '../config/stack.ts';

const BACKEND_DIR = resolve(import.meta.dirname, '../../backend');
const WIPE_SQL = 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;';

/**
 * Rebuilds the e2e database from scratch — empty schema, every migration, the seed — so each run starts from the
 * same data and fresh rate limits. Runs through the backend's own Prisma CLI, before the backend starts.
 */
const resetDatabase = (): void => {
    const env = { ...process.env, ...backendEnv() };
    const run = (args: string[], input?: string): void => {
        execFileSync('npx', args, {
            cwd: BACKEND_DIR,
            env,
            input,
            stdio: [input ? 'pipe' : 'ignore', 'ignore', 'inherit'],
        });
    };
    run(['prisma', 'db', 'execute', '--stdin'], WIPE_SQL);
    run(['prisma', 'migrate', 'deploy']);
    run(['prisma', 'db', 'seed']);
    process.stdout.write(`e2e database "${DATABASE_NAME}" rebuilt and seeded\n`);
};

resetDatabase();
