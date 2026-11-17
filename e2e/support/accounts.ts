/** The seed's shared password — public by design (fictional accounts, dev data only). */
export const SEED_PASSWORD = 'Workus-Dev-2026!';

export interface Account {
    name: string;
    email: string;
    password: string;
}

const seeded = (name: string, email: string): Account => ({ name, email, password: SEED_PASSWORD });

/** Accounts the seed creates in every e2e database (`backend/prisma/seed-data.ts`). */
export const ACCOUNTS = {
    osdbOwner: seeded('Sophia Carter', 'sophia.carter@osdb.io'),
    osdbAdmin: seeded('Marcus Reid', 'marcus.reid@osdb.io'),
    osdbEmployee: seeded('Ava Thompson', 'ava.thompson@osdb.io'),
    vortexOwner: seeded('Liam Foster', 'liam.foster@vortex.io'),
    platformAdmin: seeded('Alex Morgan', 'admin@workus.io'),
} as const;
