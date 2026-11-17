import { EmployeeProfilePage } from '../pages/employee-profile-page.ts';
import { ACCOUNTS } from '../support/accounts.ts';
import { expect, test } from '../support/fixtures.ts';
import { newPerson } from '../support/people.ts';

test.describe('Reviews', () => {
    test('an admin records a completed review with a new salary', async ({ apiAs, signInAs }) => {
        const person = newPerson('osdb.io');
        const hired = await (await apiAs(ACCOUNTS.osdbAdmin)).hire(person);
        const page = await signInAs(ACCOUNTS.osdbAdmin);
        const profile = new EmployeeProfilePage(page);
        const title = `Probation review ${person.lastName}`;

        await profile.goto(hired.id);
        await expect(profile.heading(person.fullName)).toBeVisible();
        await profile.openTab('Review');
        await profile.addReview({
            title,
            status: 'Completed',
            salary: '5100',
            responsibleName: ACCOUNTS.osdbAdmin.name,
        });

        await expect(page.getByText(`Review “${title}” was added`)).toBeVisible();
        await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
    });
});
