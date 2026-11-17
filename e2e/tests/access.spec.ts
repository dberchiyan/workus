import { AppShell } from '../pages/app-shell.ts';
import { EmployeeProfilePage } from '../pages/employee-profile-page.ts';
import { ACCOUNTS } from '../support/accounts.ts';
import { expect, test } from '../support/fixtures.ts';
import { newPerson } from '../support/people.ts';

test.describe('Access', () => {
    test("another company's employee answers like one that does not exist", async ({ apiAs, signInAs }) => {
        const hired = await (await apiAs(ACCOUNTS.osdbAdmin)).hire(newPerson('osdb.io'));
        const profile = new EmployeeProfilePage(await signInAs(ACCOUNTS.vortexOwner));

        await profile.goto(hired.id);

        await expect(profile.notFound).toBeVisible();
    });

    test('an employee sees only their own sections', async ({ signInAs }) => {
        const shell = new AppShell(await signInAs(ACCOUNTS.osdbEmployee));

        await expect(shell.menuLink('Dashboard')).toBeVisible();
        await expect(shell.menuLink('Calendar')).toBeVisible();
        await expect(shell.menuLink('Employees')).toHaveCount(0);
        await expect(shell.menuLink('Requests')).toHaveCount(0);
    });
});
