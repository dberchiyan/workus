import { BillingPage } from '../pages/billing-page.ts';
import { ACCOUNTS } from '../support/accounts.ts';
import { ApiSession } from '../support/api.ts';
import { expect, test } from '../support/fixtures.ts';
import { newCompanyName, newPerson, STRONG_PASSWORD } from '../support/people.ts';

test.describe('Billing', () => {
    test('an owner upgrades, schedules a downgrade and keeps the plan', async ({ playwright, apiAs, signInAs }) => {
        const companyName = newCompanyName();
        const owner = newPerson('northwind.test');
        const registration = await ApiSession.register(playwright.request, {
            companyName,
            owner,
            password: STRONG_PASSWORD,
        });
        await registration.dispose();
        await (await apiAs(ACCOUNTS.platformAdmin)).approveCompany(companyName);

        const page = await signInAs({ name: owner.fullName, email: owner.email, password: STRONG_PASSWORD });
        const billing = new BillingPage(page);

        await test.step('a new company starts free and paid features stay locked', async () => {
            await page.goto('/insights');
            await expect(page.getByRole('link', { name: 'See plans' })).toBeVisible();
            await billing.goto();
            await expect(billing.text('Free')).toBeVisible();
        });

        await test.step('upgrading to Team goes through checkout and comes back active', async () => {
            await billing.button('Upgrade to Team').click();
            await expect(billing.text('Your company is now on the Team plan.')).toBeVisible();
            await expect(billing.text('Active')).toBeVisible();
            await expect(billing.text(/^Next charge on /)).toBeVisible();
        });

        await test.step('a downgrade waits for the end of the paid period', async () => {
            await billing.changePlan('Downgrade to Starter');
            await expect(billing.text(/^Switches to Starter on /)).toBeVisible();
            await expect(billing.button('Keep Team')).toBeVisible();
        });

        await test.step('keeping the plan drops the scheduled change', async () => {
            await billing.changePlan('Keep Team');
            await expect(billing.text('Team continues.')).toBeVisible();
            await expect(billing.text(/^Switches to Starter on /)).toBeHidden();
        });
    });
});
