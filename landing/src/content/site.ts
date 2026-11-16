/**
 * Facts about the site itself: name, routes into the app (same origin — nginx serves the app at
 * every path but a signed-out `/`), demo accounts. Every claim on the page follows CONTEXT.md.
 */
export const SITE = {
  name: 'Workus',
  title: 'Workus · Open-source HR app for small teams',
  description:
    'Employee records, salary reviews, time off, a shared calendar and yearly reports in one open-source HR app for owners, admins and employees. Try the live demo.',
  locale: 'en',
  ogLocale: 'en_US',
  themeColor: { light: '#f7f9fb', dark: '#0f1a22' },
  links: {
    signIn: '/login',
    signUp: '/signup',
    github: 'https://github.com/dberchiyan/workus',
    readme: 'https://github.com/dberchiyan/workus#readme',
    issues: 'https://github.com/dberchiyan/workus/issues',
  },
} as const;

/**
 * The public demo's shared accounts (README → Demo accounts), one per role — the Demo section is
 * also where the page says what each role can do. The data resets every morning.
 */
export const DEMO = {
  password: 'Workus-Dev-2026!',
  accounts: [
    {
      role: 'Owner',
      name: 'Sophia Carter',
      email: 'sophia.carter@osdb.io',
      summary: 'Runs the company account.',
      items: ['Everything an admin does', 'Company name', 'Who is an admin or an owner'],
    },
    {
      role: 'Admin',
      name: 'Marcus Reid',
      email: 'marcus.reid@osdb.io',
      summary: 'Runs people and requests.',
      items: [
        'People, reviews, salaries',
        'Decides time-off requests',
        'Departments, holidays, insights',
      ],
    },
    {
      role: 'Employee',
      name: 'Ava Thompson',
      email: 'ava.thompson@osdb.io',
      summary: 'Manages their own time off.',
      items: ['Balances and requests', 'Comments with admins', 'The company calendar'],
    },
  ],
} as const;

export type DemoAccount = (typeof DEMO.accounts)[number];
