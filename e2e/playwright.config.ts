import { defineConfig, devices } from '@playwright/test';

import { API_URL, backendEnv, WEB_PORT, WEB_URL } from './config/stack.ts';

const isCI = Boolean(process.env.CI);
const SERVER_START_TIMEOUT_MS = 240_000;
const TEST_TIMEOUT_MS = 60_000;
const EXPECT_TIMEOUT_MS = 10_000;

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    workers: 1,
    forbidOnly: isCI,
    retries: isCI ? 1 : 0,
    timeout: TEST_TIMEOUT_MS,
    expect: { timeout: EXPECT_TIMEOUT_MS },
    reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: WEB_URL,
        locale: 'en-US',
        timezoneId: 'UTC',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'phone', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    ],
    webServer: [
        {
            name: 'backend',
            cwd: '../backend',
            command: 'npm run build && node ../e2e/setup/reset-database.ts && node dist/main.js',
            url: `${API_URL}/health/ready`,
            env: backendEnv(),
            timeout: SERVER_START_TIMEOUT_MS,
            reuseExistingServer: false,
            stdout: 'ignore',
            stderr: 'pipe',
        },
        {
            name: 'frontend',
            cwd: '../frontend',
            command: `npm run build && npx vite preview --port ${WEB_PORT} --strictPort`,
            url: WEB_URL,
            env: { API_PROXY_TARGET: API_URL, VITE_API_BASE_URL: '' },
            timeout: SERVER_START_TIMEOUT_MS,
            reuseExistingServer: false,
            stdout: 'ignore',
            stderr: 'pipe',
        },
    ],
});
