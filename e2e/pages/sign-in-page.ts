import { type Locator, type Page } from '@playwright/test';

export class SignInPage {
    readonly heading: Locator;
    readonly email: Locator;
    readonly password: Locator;
    readonly submit: Locator;

    constructor(private readonly page: Page) {
        this.heading = page.getByRole('heading', { name: 'Sign in' });
        this.email = page.getByLabel('Email');
        this.password = page.getByRole('textbox', { name: 'Password', exact: true });
        this.submit = page.getByRole('button', { name: 'Sign in' });
    }

    async goto(): Promise<void> {
        await this.page.goto('/login');
    }

    async signIn(email: string, password: string): Promise<void> {
        await this.email.fill(email);
        await this.password.fill(password);
        await this.submit.click();
    }

    error(message: string): Locator {
        return this.page.getByText(message);
    }
}
