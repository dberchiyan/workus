import { randomUUID } from 'node:crypto';

import { type APIRequest, type APIRequestContext, type APIResponse } from '@playwright/test';

import { WEB_URL } from '../config/stack.ts';
import { type Account } from './accounts.ts';
import { todayIso } from './dates.ts';
import { type Person } from './people.ts';

const XSRF_COOKIE = 'XSRF-TOKEN';
const STARTING_SALARY = '4200';

export interface CurrentUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

export interface HiredEmployee {
    id: string;
    firstName: string;
    lastName: string;
    temporaryPassword: string;
}

interface Position {
    id: string;
    title: string;
}

interface Company {
    id: string;
    name: string;
}

export interface Registration {
    companyName: string;
    owner: Person;
    password: string;
}

const readJson = async <T>(response: APIResponse): Promise<T> => {
    const body = await response.text();
    if (!response.ok()) {
        throw new Error(`${response.url()} answered ${response.status()}: ${body}`);
    }
    return (body ? JSON.parse(body) : undefined) as T;
};

/**
 * One account's API session for arranging test data fast (hiring people, approving companies) — the flows under
 * test still go through the UI. Calls go through the web origin like the browser's, so the same cookies, CSRF
 * double-submit and Idempotency-Key rules apply.
 */
export class ApiSession {
    private constructor(private readonly context: APIRequestContext) {}

    /** Signs an existing account in. */
    static async signIn(request: APIRequest, account: Account): Promise<ApiSession> {
        const context = await request.newContext({ baseURL: WEB_URL });
        await readJson(
            await context.post('/api/v1/auth/login', { data: { email: account.email, password: account.password } }),
        );
        return new ApiSession(context);
    }

    /** Creates a company the way the sign-up page does; it waits for a platform admin's approval. */
    static async register(request: APIRequest, registration: Registration): Promise<ApiSession> {
        const context = await request.newContext({ baseURL: WEB_URL });
        await readJson(
            await context.post('/api/v1/registrations', {
                data: {
                    organisationName: registration.companyName,
                    firstName: registration.owner.firstName,
                    lastName: registration.owner.lastName,
                    email: registration.owner.email,
                    password: registration.password,
                },
            }),
        );
        return new ApiSession(context);
    }

    async me(): Promise<CurrentUser> {
        return this.get<CurrentUser>('/api/v1/auth/me');
    }

    /** Hires a person starting today on the company's first position; returns the one-time password. */
    async hire(person: Person, responsibleUserIds: string[] = []): Promise<HiredEmployee> {
        const { content } = await this.get<{ content: Position[] }>('/api/v1/positions');
        const position = content[0];
        if (!position) {
            throw new Error('The company has no positions to hire into');
        }
        return this.post<HiredEmployee>(
            '/api/v1/employees',
            {
                firstName: person.firstName,
                lastName: person.lastName,
                email: person.email,
                positionId: position.id,
                startsAt: todayIso(),
                startingSalary: STARTING_SALARY,
                responsibleUserIds,
            },
            { isIdempotent: true },
        );
    }

    /** Approves a waiting company by its exact name (platform admins only). */
    async approveCompany(name: string): Promise<void> {
        const query = new URLSearchParams({ status: 'PENDING', search: name });
        const { content } = await this.get<{ content: Company[] }>(`/api/v1/platform/organisations?${query}`);
        const company = content.find((candidate) => candidate.name === name);
        if (!company) {
            throw new Error(`No company named "${name}" waits for approval`);
        }
        await this.post(`/api/v1/platform/organisations/${company.id}/approval`);
    }

    async dispose(): Promise<void> {
        await this.context.dispose();
    }

    private async get<T>(path: string): Promise<T> {
        return readJson<T>(await this.context.get(path));
    }

    private async post<T>(path: string, data?: unknown, options: { isIdempotent?: boolean } = {}): Promise<T> {
        const headers: Record<string, string> = { 'X-XSRF-TOKEN': await this.xsrfToken() };
        if (options.isIdempotent) {
            headers['Idempotency-Key'] = randomUUID();
        }
        return readJson<T>(await this.context.post(path, { data, headers }));
    }

    private async xsrfToken(): Promise<string> {
        const { cookies } = await this.context.storageState();
        return cookies.find((cookie) => cookie.name === XSRF_COOKIE)?.value ?? '';
    }
}
