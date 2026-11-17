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

export interface Highlight {
  icon: IconName;
  value: string;
  label: string;
}

export interface Question {
  q: string;
  a: string;
}

/** A plan as the pricing table shows it (CONTEXT.md → Plans and billing: the same numbers). */
export interface PricingPlan {
  id: 'starter' | 'team' | 'business';
  name: string;
  /** Whole dollars per month; "0" is free. Shown as "$29", the number alone for structured data. */
  price: string;
  limit: string;
  summary: string;
  features: readonly string[];
  /** The card that stands out. */
  highlighted?: boolean;
}

export const LANDING = {
  nav: [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#pricing', label: 'Pricing' },
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
    { icon: 'history', value: 'Full audit trail', label: 'every change kept, nothing overwritten' },
    {
      icon: 'sun',
      value: 'Accurate time off',
      label: 'counted in working days, not calendar days',
    },
    { icon: 'trending', value: 'Salary history', label: 'every review and raise in one place' },
    { icon: 'chart', value: 'Yearly insights', label: 'headcount and turnover vs last year' },
  ] satisfies readonly Highlight[],
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
  pricing: {
    eyebrow: 'Pricing',
    title: 'Simple plans, per company',
    lead: 'Every company starts on Starter after approval — no card, no trial to run out. Upgrade in Settings when your team grows.',
    period: '/ month',
    includes: 'Everything in',
    cta: 'Create your company',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        price: '0',
        limit: 'Up to 10 employees',
        summary: 'The basics for a small team.',
        features: ['Employee directory', 'Time off with balances', 'Company calendar and holidays'],
      },
      {
        id: 'team',
        name: 'Team',
        price: '29',
        limit: 'Up to 50 employees',
        summary: 'For companies that run reviews.',
        features: ['Reviews and salary history', 'Departments and positions you define'],
        highlighted: true,
      },
      {
        id: 'business',
        name: 'Business',
        price: '79',
        limit: 'Unlimited employees',
        summary: 'For the full picture of the company.',
        features: [
          'Yearly insights by department',
          'CSV export of change history and security log',
        ],
      },
    ] satisfies readonly PricingPlan[],
  },
  security: {
    eyebrow: 'Security',
    title: 'How Workus protects your data',
    lead: 'Workus holds salaries and personal details, so security isn’t a setting. It’s built in.',
    items: [
      {
        icon: 'building',
        title: 'Companies never mix',
        text: 'Every request is checked against your company on the server. You never see another company’s records.',
      },
      {
        icon: 'key',
        title: 'Sessions you control',
        text: 'End a session on one device or all of them at once. Idle sessions close after an hour.',
      },
      {
        icon: 'shield',
        title: 'Role-based access',
        text: 'The server checks every action against your role, not just the buttons on screen.',
      },
      {
        icon: 'history',
        title: 'Change history',
        text: 'Every change to people, reviews and requests is recorded. Nobody can edit or delete it.',
      },
      {
        icon: 'eye',
        title: 'Security log',
        text: 'Sign-ins, failed attempts, new devices and password changes, visible to the person and to admins.',
      },
      {
        icon: 'lock',
        title: 'Strong passwords',
        text: 'Passwords are stored in a form that can’t be reversed, and repeated sign-in attempts are blocked.',
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
        a: 'Small and mid-size companies that keep employee records and time off in spreadsheets and want something simpler than a large HR system. Owners and admins run it, and employees use it for their own time off.',
      },
      {
        q: 'Can companies see each other’s data?',
        a: 'No. Every record belongs to one company, and the server checks every request against it. Another company’s data is never shown to you, not even by accident.',
      },
      {
        q: 'How are time-off days counted?',
        a: 'In working days, so weekends and company holidays don’t count. Vacation and sick leave have a balance for each cycle. Days off have no limit.',
      },
      {
        q: 'Can we set up our own departments?',
        a: 'Yes. In Settings → Structure, admins add and rename departments and positions and see who holds each one.',
      },
      {
        q: 'What does it cost?',
        a: 'Starter is free for up to 10 employees. Team ($29 a month) adds reviews with salary history and your own departments and positions for up to 50 employees; Business ($79 a month) adds yearly insights and exports with no employee limit. Prices are in US dollars, billed monthly by card through Stripe.',
      },
      {
        q: 'Can I change or cancel the plan?',
        a: 'Yes, at any time in Settings → Billing. An upgrade is charged at once and applies immediately. A downgrade or cancellation takes effect at the end of the paid period, and the company goes back to Starter. Nothing is deleted: adding people and the paid features simply wait until you upgrade again.',
      },
      {
        q: 'Does it work on a phone?',
        a: 'Yes. Every screen works on phones, tablets and desktops, in light and dark themes.',
      },
      {
        q: 'Why is a new company reviewed first?',
        a: 'To keep the platform safe, our team checks every new company before it opens. Until then the owner sees a short waiting screen, and the app opens on its own once the company is approved.',
      },
      {
        q: 'What happens to the demo data?',
        a: 'The demo has two fictional companies with sample data, reset every morning. Create your own company to keep your work.',
      },
      {
        q: 'Can I run it myself?',
        a: 'Yes. Workus is open source: clone the repository and start it with Docker Compose. The README walks you through the steps.',
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
