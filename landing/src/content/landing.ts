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

export interface RoleCard {
  role: string;
  summary: string;
  items: readonly string[];
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
    eyebrow: 'HR app for growing teams',
    titleStart: 'Day-to-day HR,',
    titleAccent: 'without the busywork.',
    lead: 'Workus keeps employee records, salary reviews, time-off requests and a shared calendar together. Admins manage the company. Employees request time off and see their balances.',
    primary: 'Try the live demo',
    secondary: 'Create your company',
    note: 'No card, no install. Demo data resets every morning.',
  },
  highlights: [
    { value: '3', label: 'roles: owner, admin, employee' },
    { value: '3', label: 'kinds of time off, with balances' },
    { value: '⌘K', label: 'to find anyone or anything' },
    { value: '0', label: 'data shared between companies' },
  ],
  features: {
    eyebrow: 'Everything in one place',
    title: 'What you can do in Workus',
    lead: 'The everyday tasks of a small HR team, without a long setup.',
    items: [
      {
        id: 'people',
        icon: 'users',
        title: 'People',
        text: 'One record per person: position, start date, contacts, the admins responsible for them.',
        points: [
          'Search and filter by group',
          'A password made for each new person',
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
          'Only working days are counted',
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
        text: 'Headcount, hires and leavers, tenure, absence and average salary. One year at a time, by group.',
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
  roles: {
    eyebrow: 'Roles',
    title: 'Each role sees its own part',
    items: [
      {
        role: 'Owner',
        summary: 'Runs the company account.',
        items: ['Everything an admin does', 'Company name', 'Who is an admin or an owner'],
      },
      {
        role: 'Admin',
        summary: 'Runs people and requests.',
        items: [
          'People, reviews, salaries',
          'Decides time-off requests',
          'Holidays, insights, history',
        ],
      },
      {
        role: 'Employee',
        summary: 'Manages their own time off.',
        items: ['Balances and requests', 'Comments with admins', 'The company calendar'],
      },
    ] satisfies readonly RoleCard[],
  },
  security: {
    eyebrow: 'Security',
    title: 'How Workus protects your data',
    lead: 'Workus stores salaries and personal details, so these protections are always on.',
    items: [
      {
        icon: 'building',
        title: 'Each company is separate',
        text: 'Each company’s data is separate. Every request is checked against your company, so other companies’ records are not visible to you.',
      },
      {
        icon: 'key',
        title: 'Sessions you control',
        text: 'Sessions are stored on the server, so you can end them at once, on one device or all. Inactive sessions end after an hour.',
      },
      {
        icon: 'shield',
        title: 'Role-based access',
        text: 'The server checks every action against your role. Hidden buttons are not the only protection.',
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
        text: 'Argon2id hashing, rate-limited sign-in, and a temporary password shown only once.',
      },
    ] satisfies readonly TrustPoint[],
  },
  demo: {
    eyebrow: 'Live demo',
    title: 'Try Workus with sample data',
    lead: 'Two sample companies with people, reviews and requests. Sign in as any role. All accounts use the same password.',
    passwordLabel: 'Password',
    open: 'Open the demo',
    note: 'Demo accounts are shared, so their passwords and sessions can’t be changed. Everything resets at 08:00 Kyiv time.',
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
    title: 'Try Workus today',
    lead: 'Open the demo, or create your company.',
  },
  footer: {
    tagline: 'HR app for growing teams.',
    product: 'Product',
    account: 'Account',
    rights: 'All rights reserved.',
  },
} as const;
