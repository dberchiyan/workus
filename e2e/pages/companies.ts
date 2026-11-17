import { type Locator, type Page } from '@playwright/test';

import { type Person } from '../support/people.ts';

/** The public sign-up page and the screen a new company waits on. */
export class SignUpPage {
    readonly waitingHeading: Locator;

    constructor(private readonly page: Page) {
        this.waitingHeading = page.getByRole('heading', { name: 'Waiting for approval' });
    }

    async goto(): Promise<void> {
        await this.page.goto('/signup');
    }

    async createCompany(companyName: string, owner: Person, password: string): Promise<void> {
        await this.page.getByLabel('Company name').fill(companyName);
        await this.page.getByRole('button', { name: 'Continue' }).click();
        await this.page.getByLabel('First name').fill(owner.firstName);
        await this.page.getByLabel('Last name').fill(owner.lastName);
        await this.page.getByLabel('Work email').fill(owner.email);
        await this.page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
        await this.page.getByRole('button', { name: 'Create company' }).click();
    }
}

/** Platform admins' Companies pages. */
export class CompaniesPage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/platform');
    }

    async open(companyName: string): Promise<void> {
        await this.page.getByLabel('Search by company name').fill(companyName);
        await this.page.getByRole('link', { name: companyName }).click();
    }

    async approve(companyName: string): Promise<void> {
        await this.page.getByRole('button', { name: 'Approve' }).click();
        const dialog = this.page.getByRole('dialog', { name: `Approve ${companyName}?` });
        await dialog.getByRole('button', { name: 'Approve' }).click();
    }

    status(name: string): Locator {
        return this.page.getByText(name, { exact: true }).first();
    }
}
