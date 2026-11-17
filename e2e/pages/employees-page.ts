import { type Locator, type Page } from '@playwright/test';

import { todayIso } from '../support/dates.ts';
import { type Person } from '../support/people.ts';

/** The two-step "Add employee" dialog and the one-time sign-in details it ends with. */
export class AddEmployeeDialog {
    readonly dialog: Locator;

    constructor(private readonly page: Page) {
        this.dialog = page.getByRole('dialog', { name: 'Add employee' });
    }

    async fillDetails(person: Person, position: string, startingSalary: string): Promise<void> {
        await this.dialog.getByLabel('First name').fill(person.firstName);
        await this.dialog.getByLabel('Last name').fill(person.lastName);
        await this.dialog.getByLabel('Work email').fill(person.email);
        await this.dialog.getByRole('combobox', { name: 'Position' }).click();
        await this.page.getByRole('option', { name: position, exact: true }).click();
        await this.dialog.getByLabel('Start date').fill(todayIso());
        await this.dialog.getByLabel('Starting salary (USD per month)').fill(startingSalary);
    }

    async next(): Promise<void> {
        await this.dialog.getByRole('button', { name: 'Next' }).click();
    }

    async create(): Promise<void> {
        await this.dialog.getByRole('button', { name: 'Create employee' }).click();
    }

    accessHeading(person: Person): Locator {
        return this.dialog.getByRole('heading', { name: `${person.fullName} can now sign in` });
    }

    /** Reads the generated password (showing it first where it starts hidden) — the only time it is shown. */
    async revealPassword(): Promise<string> {
        const show = this.dialog.getByRole('button', { name: 'Show password' });
        if (await show.isVisible()) {
            await show.click();
        }
        return (await this.dialog.locator('dt:text-is("Password") + dd').innerText()).trim();
    }

    async finish(): Promise<void> {
        await this.dialog.getByLabel('I have saved the password').check();
        await this.dialog.getByRole('button', { name: 'Done' }).click();
    }
}

export class EmployeesPage {
    readonly heading: Locator;
    readonly addButton: Locator;
    readonly search: Locator;

    constructor(private readonly page: Page) {
        this.heading = page.getByRole('heading', { name: 'Employees', level: 1 });
        this.addButton = page.getByRole('button', { name: 'Add employee' });
        this.search = page.getByRole('searchbox', { name: 'Search by name or email' });
    }

    row(fullName: string): Locator {
        return this.page.getByRole('link', { name: fullName });
    }

    async goto(): Promise<void> {
        await this.page.goto('/employees');
    }

    async openAddEmployee(): Promise<AddEmployeeDialog> {
        await this.addButton.click();
        return new AddEmployeeDialog(this.page);
    }
}
