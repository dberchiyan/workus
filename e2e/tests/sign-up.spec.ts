import { AppShell } from '../pages/app-shell.ts';
import { CompaniesPage, SignUpPage } from '../pages/companies.ts';
import { ACCOUNTS } from '../support/accounts.ts';
import { expect, test } from '../support/fixtures.ts';
import { newCompanyName, newPerson, STRONG_PASSWORD } from '../support/people.ts';

test.describe('Company sign-up', () => {
    test('a new company waits for approval and opens once a platform admin approves it', async ({ page, signInAs }) => {
        const companyName = newCompanyName();
        const owner = newPerson('northwind.test');
        const signUp = new SignUpPage(page);

        await test.step('the owner creates the company', async () => {
            await signUp.goto();
            await signUp.createCompany(companyName, owner, STRONG_PASSWORD);
            await expect(signUp.waitingHeading).toBeVisible();
            await expect(new AppShell(page).navigation).toBeHidden();
        });

        await test.step('a platform admin approves it', async () => {
            const platform = await signInAs(ACCOUNTS.platformAdmin);
            const companies = new CompaniesPage(platform);
            await companies.goto();
            await companies.open(companyName);
            await companies.approve(companyName);
            await expect(companies.status('Active')).toBeVisible();
        });

        await test.step('the owner is let in', async () => {
            await page.reload();
            await expect(new AppShell(page).menuLink('Employees')).toBeVisible();
        });
    });
});
