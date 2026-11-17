import { type Locator, type Page } from '@playwright/test';

/** The signed-in frame: main menu, account menu. */
export class AppShell {
    readonly navigation: Locator;

    constructor(private readonly page: Page) {
        this.navigation = page.getByRole('navigation', { name: 'Main navigation' });
    }

    menuLink(name: string): Locator {
        return this.navigation.getByRole('link', { name });
    }

    async signOut(): Promise<void> {
        await this.page.getByRole('button', { name: /^Account menu for / }).click();
        await this.page.getByRole('menuitem', { name: 'Sign out' }).click();
    }
}
