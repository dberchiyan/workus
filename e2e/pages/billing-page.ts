import { type Locator, type Page } from '@playwright/test';

/** Settings → Billing: the current plan, the plan cards and the change dialog. */
export class BillingPage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/settings/billing');
    }

    text(content: string | RegExp): Locator {
        return this.page.getByText(content).first();
    }

    button(name: string): Locator {
        return this.page.getByRole('button', { name, exact: true });
    }

    /** Opens a plan action and confirms it in the dialog that names the same action. */
    async changePlan(action: string): Promise<void> {
        await this.button(action).click();
        const dialog = this.page.getByRole('dialog', { name: `${action}?` });
        await dialog.getByRole('button', { name: action, exact: true }).click();
    }
}
