import { type BrowserContext, expect, type Page, test as base } from '@playwright/test';

import { type Account } from './accounts.ts';
import { ApiSession } from './api.ts';

interface Fixtures {
    /** A fresh browser context signed in as the account (session from the login API), on the app's home page. */
    signInAs: (account: Account) => Promise<Page>;
    /** An API session of the account, for arranging data. */
    apiAs: (account: Account) => Promise<ApiSession>;
}

/**
 * The project's `test`: every spec imports it from here. Each signed-in actor gets its own browser context, so a
 * flow between people (an employee asks, an admin approves) runs side by side like two real browsers.
 */
export const test = base.extend<Fixtures>({
    signInAs: async ({ browser, baseURL, viewport, locale, timezoneId, isMobile, hasTouch }, use) => {
        const contexts: BrowserContext[] = [];
        await use(async (account) => {
            const context = await browser.newContext({
                ...(baseURL ? { baseURL } : {}),
                viewport,
                ...(locale ? { locale } : {}),
                ...(timezoneId ? { timezoneId } : {}),
                isMobile,
                hasTouch,
            });
            contexts.push(context);
            const response = await context.request.post('/api/v1/auth/login', {
                data: { email: account.email, password: account.password },
            });
            expect(response.ok(), `sign-in of ${account.email}`).toBe(true);
            const page = await context.newPage();
            await page.goto('/');
            return page;
        });
        await Promise.all(contexts.map(async (context) => context.close()));
    },
    apiAs: async ({ playwright }, use) => {
        const sessions: ApiSession[] = [];
        await use(async (account) => {
            const session = await ApiSession.signIn(playwright.request, account);
            sessions.push(session);
            return session;
        });
        await Promise.all(sessions.map(async (session) => session.dispose()));
    },
});

export { expect } from '@playwright/test';
