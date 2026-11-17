import { AppShell } from '../pages/app-shell.ts';
import { EmployeesPage } from '../pages/employees-page.ts';
import { SignInPage } from '../pages/sign-in-page.ts';
import { ACCOUNTS } from '../support/accounts.ts';
import { expect, test } from '../support/fixtures.ts';

test.describe('Sign-in', () => {
    test('returns to the page that was asked for', { tag: '@mobile' }, async ({ page }) => {
        const signIn = new SignInPage(page);
        const employees = new EmployeesPage(page);

        await employees.goto();
        await expect(page).toHaveURL(/\/login$/);

        await signIn.signIn(ACCOUNTS.osdbOwner.email, ACCOUNTS.osdbOwner.password);

        await expect(page).toHaveURL(/\/employees$/);
        await expect(employees.heading).toBeVisible();
    });

    test('answers a wrong password like an unknown email', async ({ page }) => {
        const signIn = new SignInPage(page);
        await signIn.goto();

        await signIn.signIn(ACCOUNTS.osdbOwner.email, 'Not-The-Password-1!');
        await expect(signIn.error('Invalid email or password')).toBeVisible();

        await signIn.signIn('nobody@osdb.io', 'Not-The-Password-1!');
        await expect(signIn.error('Invalid email or password')).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });

    test('signs out and closes the app behind it', async ({ signInAs }) => {
        const page = await signInAs(ACCOUNTS.osdbOwner);

        await new AppShell(page).signOut();
        await expect(new SignInPage(page).heading).toBeVisible();

        await page.goto('/employees');
        await expect(page).toHaveURL(/\/login$/);
    });
});
