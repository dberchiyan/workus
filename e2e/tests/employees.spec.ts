import { EmployeesPage } from '../pages/employees-page.ts';
import { SignInPage } from '../pages/sign-in-page.ts';
import { MyTimeOff } from '../pages/time-off.ts';
import { ACCOUNTS } from '../support/accounts.ts';
import { expect, test } from '../support/fixtures.ts';
import { newPerson } from '../support/people.ts';

test.describe('Employees', () => {
    test('an owner adds an employee, who signs in with the one-time password', async ({ signInAs, browser }) => {
        const person = newPerson('osdb.io');
        const owner = await signInAs(ACCOUNTS.osdbOwner);
        const employees = new EmployeesPage(owner);
        let password = '';

        await test.step('the owner fills both steps and creates the account', async () => {
            await employees.goto();
            const dialog = await employees.openAddEmployee();
            await dialog.fillDetails(person, 'Backend Developer', '4800');
            await dialog.next();
            await dialog.create();
            await expect(dialog.accessHeading(person)).toBeVisible();
            password = await dialog.revealPassword();
            expect(password).toMatch(/^\S{16}$/);
            await dialog.finish();
            await expect(dialog.dialog).toBeHidden();
        });

        await test.step('the new person appears in the list', async () => {
            await employees.search.fill(person.lastName);
            await expect(employees.row(person.fullName)).toBeVisible();
        });

        await test.step('the employee signs in and lands on their own dashboard', async () => {
            const context = await browser.newContext();
            const page = await context.newPage();
            const signIn = new SignInPage(page);
            await signIn.goto();
            await signIn.signIn(person.email, password);
            await expect(new MyTimeOff(page).heading).toBeVisible();
            await context.close();
        });
    });
});
