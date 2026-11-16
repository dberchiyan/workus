import type { IconName } from '@/components/ui/icons';

/**
 * Every word on the landing page, in one typed place — components only lay it out. A second
 * language is a second object of the same type.
 */
export interface Feature {
  id: 'people' | 'reviews' | 'timeOff' | 'calendar' | 'insights' | 'activity';
  icon: IconName;
  title: string;
  text: string;
  points: readonly string[];
}

export interface Step {
  title: string;
  text: string;
}

export interface TrustPoint {
  icon: IconName;
  title: string;
  text: string;
}

export interface Question {
  q: string;
  a: string;
}

export const LANDING = {
  nav: [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#security', label: 'Security' },
    { href: '#faq', label: 'FAQ' },
  ],
  hero: {
    eyebrow: 'Open-source HR for small teams',
    titleStart: 'Day-to-day HR,',
    titleAccent: 'without the busywork.',
    lead: 'People, salaries, time off and a shared calendar in one place. Admins run the company, employees handle their own time off.',
    primary: 'Try the live demo',
    secondary: 'Create your company',
    note: 'No card, no install.',
    source: 'Open source on GitHub',
  },
  highlights: [
    { value: 'Every change', label: 'on record, nobody can edit it' },
    { value: 'Working days', label: 'counted, not calendar days' },
    { value: '⌘K', label: 'to find anyone or anything' },
    { value: 'Light & dark', label: 'on any screen' },
  ],
  features: {
    eyebrow: 'Everything in one place',
    title: 'What you can do in Workus',
    lead: 'Everything a small HR team does every week.',
    items: [
      {
        id: 'people',
        icon: 'users',
        title: 'People',
        text: 'One record per person: department, position, start date, contacts and the admins responsible for them.',
        points: [
          'Departments and positions you define',
          'Search and filter by department',
          'Access ends on the leave date',
        ],
      },
      {
        id: 'reviews',
        icon: 'trending',
        title: 'Reviews & salaries',
        text: 'Salary history from completed reviews, with the change in % and feedback from HR, leads, team and client.',
        points: [
          'Scheduled, completed, canceled',
          'Starting salary as the first point',
          'Money stored as exact decimals',
        ],
      },
      {
        id: 'timeOff',
        icon: 'sun',
        title: 'Time off',
        text: 'Vacation, sick days and days off with balances per cycle. Employees ask, the right admins decide.',
        points: [
          'Weekends and company holidays skipped',
          'Comments on every request',
          'Reminders for waiting requests',
        ],
      },
      {
        id: 'calendar',
        icon: 'calendar',
        title: 'Shared calendar',
        text: 'One month for the whole company. See who is away, who has asked for time off and which days are holidays.',
        points: ['Approved and pending side by side', 'Filter by type, search by name'],
      },
      {
        id: 'insights',
        icon: 'chart',
        title: 'Insights',
        text: 'Headcount, hires and leavers, tenure, absence and average salary. One year at a time, by department.',
        points: ['Every chart also as a table', 'Compared with the previous year'],
      },
      {
        id: 'activity',
        icon: 'history',
        title: 'Activity & notices',
        text: 'Every change is recorded: who made it, when, and the old and new value. People get notified about what concerns them.',
        points: ['History nobody can edit', 'In-app notifications'],
      },
    ] satisfies readonly Feature[],
  },
  steps: {
    eyebrow: 'How it works',
    title: 'Get started in three steps',
    items: [
      {
        title: 'Create your company',
        text: 'Enter your company name and your details. You become the owner.',
      },
      {
        title: 'We approve it',
        text: 'The Workus team checks every new company. The app opens as soon as it is approved.',
      },
      {
        title: 'Add your people',
        text: 'Each person gets a generated password, shown to you once. They sign in and see what their role allows.',
      },
    ] satisfies readonly Step[],
  },
  security: {
    eyebrow: 'Security',
    title: 'How Workus protects your data',
    lead: 'Workus stores salaries and personal details, so these protections are always on.',
    items: [
      {
        icon: 'building',
        title: 'Companies never mix',
        text: 'Every request is checked against your company on the server. Other companies’ records are never visible to you.',
      },
      {
        icon: 'key',
        title: 'Sessions you control',
        text: 'Sessions are stored on the server, so you can end them at once, on one device or all. Inactive sessions end after an hour.',
      },
      {
        icon: 'shield',
        title: 'Role-based access',
        text: 'The server checks every action against your role, not just the buttons you see.',
      },
      {
        icon: 'history',
        title: 'Change history',
        text: 'Every change to people, reviews and requests is recorded and can’t be edited or deleted.',
      },
      {
        icon: 'eye',
        title: 'Security log',
        text: 'Sign-ins, failed attempts, new devices and password changes. The person and their admins can see it.',
      },
      {
        icon: 'lock',
        title: 'Strong passwords',
        text: 'Argon2id hashing, rate-limited sign-in, temporary passwords shown once.',
      },
    ] satisfies readonly TrustPoint[],
  },
  demo: {
    eyebrow: 'Live demo',
    title: 'Try it as any role',
    lead: 'Two sample companies with people, reviews and requests. Each role sees its own part. One password for every account.',
    passwordLabel: 'Password',
    open: 'Open the demo',
    note: 'Shared accounts: passwords and sessions are locked. Data resets daily at 08:00 Kyiv.',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Questions, answered',
    items: [
      {
        q: 'Who is Workus for?',
        a: 'Companies that keep employee records and time off in spreadsheets and want something simpler than a large HR system. Owners and admins manage it. Employees use it for their own time off.',
      },
      {
        q: 'Why does a new company need approval?',
        a: 'Our team checks every new company before it opens. Until then the owner sees a waiting screen. The app opens on its own once the company is approved.',
      },
      {
        q: 'Can companies see each other’s data?',
        a: 'No. Every record belongs to one company and every request is checked against it on the server. An id from another company answers exactly like one that doesn’t exist.',
      },
      {
        q: 'Can I run it myself?',
        a: 'Yes. Workus is open source. Clone the repository and start it with Docker Compose. The README has the steps.',
      },
      {
        q: 'Can we set up our own departments?',
        a: 'Yes. In Settings → Structure admins add departments and positions, rename them and see who holds each position.',
      },
      {
        q: 'How are time-off days counted?',
        a: 'In working days. Weekends and company holidays are not counted. Vacation and sick days have a balance per cycle. Days off are unlimited.',
      },
      {
        q: 'Does it work on a phone?',
        a: 'Yes. Every screen works on phones, tablets and desktops, in light and dark themes.',
      },
      {
        q: 'What happens to the demo data?',
        a: 'It is sample data in two fictional companies, reset every morning. Create your own company to keep your work.',
      },
    ] satisfies readonly Question[],
  },
  cta: {
    title: 'See it with real-looking data',
    lead: 'Sign in as an owner, admin or employee. No sign-up needed.',
    source: 'Or read the code on GitHub',
  },
  footer: {
    tagline: 'Open-source HR for small teams.',
    product: 'Product',
    account: 'Account',
    resources: 'Resources',
    github: 'GitHub',
    readme: 'Documentation',
    issues: 'Report an issue',
    rights: 'All rights reserved.',
  },
} as const;
