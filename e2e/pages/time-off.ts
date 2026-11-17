import { type Locator, type Page } from '@playwright/test';

const MAX_MONTHS_AHEAD = 3;

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** An employee's own time off on their dashboard: the request list and the "Create request" dialog. */
export class MyTimeOff {
    readonly heading: Locator;

    constructor(private readonly page: Page) {
        this.heading = page.getByRole('heading', { name: 'Your requests' });
    }

    async requestDayOff(firstDay: string, lastDay: string, note: string): Promise<void> {
        await this.page.getByRole('button', { name: 'Create request' }).click();
        const dialog = this.page.getByRole('dialog', { name: 'Create new request' });
        await dialog.locator('label').filter({ hasText: 'Days off' }).click();
        await this.pickDay(dialog, firstDay);
        await this.pickDay(dialog, lastDay);
        await dialog.getByLabel('Comment').fill(note);
        await dialog.getByRole('button', { name: 'Send request' }).click();
    }

    status(name: string): Locator {
        return this.page.getByText(name, { exact: true }).filter({ visible: true }).first();
    }

    private async pickDay(dialog: Locator, day: string): Promise<void> {
        const cell = dialog.locator(`[data-date="${day}"]`);
        for (let month = 0; month < MAX_MONTHS_AHEAD && !(await cell.isVisible()); month += 1) {
            await dialog.getByRole('button', { name: 'Next month' }).click();
        }
        await cell.click();
    }
}

/** The admins' Requests page. */
export class RequestsPage {
    readonly heading: Locator;

    constructor(private readonly page: Page) {
        this.heading = page.getByRole('heading', { name: 'Requests', level: 1 });
    }

    async goto(): Promise<void> {
        await this.page.goto('/requests');
    }

    approveButton(fullName: string): Locator {
        return this.page.getByRole('button', { name: new RegExp(`^Approve the .+ request of ${escape(fullName)}`) });
    }

    notice(text: string): Locator {
        return this.page.getByText(text);
    }
}
