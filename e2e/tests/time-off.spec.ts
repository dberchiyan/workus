import { MyTimeOff, RequestsPage } from '../pages/time-off.ts';
import { ACCOUNTS } from '../support/accounts.ts';
import { nextWeekday, todayIso } from '../support/dates.ts';
import { expect, test } from '../support/fixtures.ts';
import { newPerson } from '../support/people.ts';

test.describe('Time off', () => {
    test('an employee asks for days off and their responsible admin approves', async ({ apiAs, signInAs }) => {
        const person = newPerson('osdb.io');
        const adminApi = await apiAs(ACCOUNTS.osdbAdmin);
        const admin = await adminApi.me();
        const hired = await adminApi.hire(person, [admin.id]);
        const firstDay = nextWeekday(todayIso());
        const lastDay = nextWeekday(firstDay);

        const employeePage = await signInAs({
            name: person.fullName,
            email: person.email,
            password: hired.temporaryPassword,
        });
        const myTimeOff = new MyTimeOff(employeePage);

        await test.step('the employee sends the request', async () => {
            await expect(myTimeOff.heading).toBeVisible();
            await myTimeOff.requestDayOff(firstDay, lastDay, 'Moving flats');
            await expect(myTimeOff.status('Pending')).toBeVisible();
        });

        await test.step('the responsible admin approves it on Requests', async () => {
            const requests = new RequestsPage(await signInAs(ACCOUNTS.osdbAdmin));
            await requests.goto();
            await requests.approveButton(person.fullName).click();
            await expect(requests.notice(`Approved: ${person.fullName}`)).toBeVisible();
            await expect(requests.approveButton(person.fullName)).toBeHidden();
        });

        await test.step('the employee sees the decision', async () => {
            await employeePage.reload();
            await expect(myTimeOff.status('Approved')).toBeVisible();
        });
    });
});
