/**
 * Facts about the site itself: name, routes into the app (same origin — nginx serves the app at
 * every path but a signed-out `/`), demo accounts. Every claim on the page follows CONTEXT.md.
 */
export const SITE = {
  name: 'Workus',
  title: 'Workus · HR app for growing teams',
  description:
    'Employee records, salary reviews, time off, a shared calendar and yearly reports in one HR app for owners, admins and employees. Try the live demo.',
  locale: 'en',
  ogLocale: 'en_US',
  themeColor: { light: '#f7f9fb', dark: '#0f1a22' },
  links: {
    signIn: '/login',
    signUp: '/signup',
  },
} as const;

/** The public demo's shared accounts (README → Demo accounts); the data resets every morning. */
export const DEMO = {
  password: 'Workus-Dev-2026!',
  accounts: [
    {
      role: 'Owner',
      name: 'Sophia Carter',
      email: 'sophia.carter@osdb.io',
      sees: 'Everything an admin sees, plus the company name and who runs it.',
    },
    {
      role: 'Admin',
      name: 'Marcus Reid',
      email: 'marcus.reid@osdb.io',
      sees: 'People, reviews and salaries, every request, insights.',
    },
    {
      role: 'Employee',
      name: 'Ava Thompson',
      email: 'ava.thompson@osdb.io',
      sees: 'Their own balances and requests, and the company calendar.',
    },
  ],
} as const;

export type DemoAccount = (typeof DEMO.accounts)[number];
