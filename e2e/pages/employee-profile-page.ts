import { type Locator, type Page } from '@playwright/test';

export interface ReviewInput {
    title: string;
    status: 'Completed' | 'Scheduled';
    salary: string;
    responsibleName: string;
}

export class EmployeeProfilePage {
    readonly notFound: Locator;

    constructor(private readonly page: Page) {
        this.notFound = page.getByRole('heading', { name: 'Employee not found' });
    }

    async goto(employeeId: string): Promise<void> {
        await this.page.goto(`/employees/${employeeId}`);
    }

    heading(fullName: string): Locator {
        return this.page.getByRole('heading', { name: fullName, level: 1 });
    }

    async openTab(name: string): Promise<void> {
        await this.page.getByRole('tab', { name }).click();
    }

    async addReview(review: ReviewInput): Promise<void> {
        await this.page.getByRole('button', { name: 'Add review' }).click();
        const dialog = this.page.getByRole('dialog', { name: 'Add review' });
        await dialog.getByLabel('Title').fill(review.title);
        await dialog.getByRole('combobox', { name: 'Status' }).click();
        await this.page.getByRole('option', { name: review.status }).click();
        await dialog.getByLabel('New salary (USD per month)').fill(review.salary);
        await dialog.getByLabel('Responsible people').fill(review.responsibleName.split(' ')[0] ?? '');
        await this.page.getByRole('option', { name: new RegExp(review.responsibleName) }).click();
        await dialog.getByRole('button', { name: 'Add review' }).click();
    }
}
