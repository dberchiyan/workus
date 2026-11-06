/** Development seed data — fictional people only. */

export const ADMINS = [
  { firstName: 'Olivia', lastName: 'Bennett', email: 'olivia.bennett@workus.dev' },
  { firstName: 'Marcus', lastName: 'Reid', email: 'marcus.reid@workus.dev' },
];

/** Tab order follows sort_order. */
export const POSITION_CATEGORIES = [
  {
    name: 'Developers',
    positions: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Mobile Developer',
    ],
  },
  {
    name: 'AI Engineers',
    positions: ['Machine Learning Engineer', 'AI Engineer', 'Data Scientist'],
  },
  { name: 'Designers', positions: ['Product Designer', 'UI/UX Designer'] },
  { name: 'Project Managers', positions: ['Project Manager', 'Delivery Manager'] },
  { name: 'QA', positions: ['QA Engineer', 'QA Automation Engineer'] },
];

export interface SeedEmployee {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  /**
   * Start date as days before the seed run: most people joined 3–7 years ago (a long salary
   * history); recent hires have only their starting salary.
   */
  startedDaysAgo: number;
  /** Termination as days before the seed run (negative = planned); absent → active. */
  terminatedDaysAgo?: number;
  /** With a termination: one of the termination reasons; OTHER needs a comment. */
  terminationReason?: 'RESIGNATION' | 'DISMISSAL' | 'END_OF_CONTRACT' | 'LAYOFF' | 'OTHER';
  terminationComment?: string;
  /** Nobody is responsible yet (shows on the "No responsible" card). */
  isUnassigned?: true;
}

export const EMPLOYEES: SeedEmployee[] = [
  {
    firstName: 'Ava',
    lastName: 'Thompson',
    email: 'ava.thompson@workus.dev',
    position: 'Frontend Developer',
    startedDaysAgo: 2100,
  },
  {
    firstName: 'Liam',
    lastName: 'Carter',
    email: 'liam.carter@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 1828,
  },
  {
    firstName: 'Sofia',
    lastName: 'Martinez',
    email: 'sofia.martinez@workus.dev',
    position: 'Product Designer',
    startedDaysAgo: 1535,
  },
  {
    firstName: 'Noah',
    lastName: 'Kim',
    email: 'noah.kim@workus.dev',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 1432,
  },
  {
    firstName: 'Emma',
    lastName: 'Novak',
    email: 'emma.novak@workus.dev',
    position: 'QA Engineer',
    startedDaysAgo: 1291,
  },
  {
    firstName: 'Lucas',
    lastName: 'Fischer',
    email: 'lucas.fischer@workus.dev',
    position: 'Project Manager',
    startedDaysAgo: 2365,
  },
  {
    firstName: 'Mia',
    lastName: 'Rossi',
    email: 'mia.rossi@workus.dev',
    position: 'Full Stack Developer',
    startedDaysAgo: 1147,
  },
  {
    firstName: 'Ethan',
    lastName: 'Walsh',
    email: 'ethan.walsh@workus.dev',
    position: 'Mobile Developer',
    startedDaysAgo: 150,
  },
  {
    firstName: 'Chloe',
    lastName: 'Dubois',
    email: 'chloe.dubois@workus.dev',
    position: 'UI/UX Designer',
    startedDaysAgo: 95,
  },
  {
    firstName: 'Daniel',
    lastName: 'Kowalski',
    email: 'daniel.kowalski@workus.dev',
    position: 'QA Automation Engineer',
    startedDaysAgo: 12,
  },
  {
    firstName: 'Isabella',
    lastName: 'Moreau',
    email: 'isabella.moreau@workus.dev',
    position: 'Delivery Manager',
    startedDaysAgo: 2555,
  },
  {
    firstName: 'James',
    lastName: 'Okafor',
    email: 'james.okafor@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 2428,
  },
  {
    firstName: 'Grace',
    lastName: 'Lindqvist',
    email: 'grace.lindqvist@workus.dev',
    position: 'Project Manager',
    startedDaysAgo: 2017,
  },
  {
    firstName: 'Henry',
    lastName: 'Silva',
    email: 'henry.silva@workus.dev',
    position: 'Frontend Developer',
    startedDaysAgo: 1922,
  },
  {
    firstName: 'Zoe',
    lastName: 'Hartmann',
    email: 'zoe.hartmann@workus.dev',
    position: 'AI Engineer',
    startedDaysAgo: 1638,
  },
  {
    firstName: 'Samuel',
    lastName: 'Petrov',
    email: 'samuel.petrov@workus.dev',
    position: 'Full Stack Developer',
    startedDaysAgo: 1574,
  },
  {
    firstName: 'Lily',
    lastName: 'Andersen',
    email: 'lily.andersen@workus.dev',
    position: 'QA Engineer',
    startedDaysAgo: 1559,
    terminatedDaysAgo: 60,
    terminationReason: 'RESIGNATION',
    terminationComment: 'Moved to another city',
  },
  {
    firstName: 'Oliver',
    lastName: 'Nakamura',
    email: 'oliver.nakamura@workus.dev',
    position: 'Data Scientist',
    startedDaysAgo: 1495,
  },
  {
    firstName: 'Amelia',
    lastName: 'Costa',
    email: 'amelia.costa@workus.dev',
    position: 'Product Designer',
    startedDaysAgo: 1464,
  },
  {
    firstName: 'Benjamin',
    lastName: 'Varga',
    email: 'benjamin.varga@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 1393,
    terminatedDaysAgo: 20,
    terminationReason: 'END_OF_CONTRACT',
  },
  {
    firstName: 'Harper',
    lastName: 'Jensen',
    email: 'harper.jensen@workus.dev',
    position: 'QA Automation Engineer',
    startedDaysAgo: 1353,
  },
  {
    firstName: 'Elijah',
    lastName: 'Brooks',
    email: 'elijah.brooks@workus.dev',
    position: 'Mobile Developer',
    startedDaysAgo: 1337,
  },
  {
    firstName: 'Evelyn',
    lastName: 'Horvat',
    email: 'evelyn.horvat@workus.dev',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 1274,
  },
  {
    firstName: 'Alexander',
    lastName: 'Byrne',
    email: 'alexander.byrne@workus.dev',
    position: 'Frontend Developer',
    startedDaysAgo: 1250,
  },
  {
    firstName: 'Ella',
    lastName: 'Marchetti',
    email: 'ella.marchetti@workus.dev',
    position: 'UI/UX Designer',
    startedDaysAgo: 1227,
    terminatedDaysAgo: 110,
    terminationReason: 'LAYOFF',
    terminationComment: 'Project closed',
  },
  {
    firstName: 'William',
    lastName: 'Ferreira',
    email: 'william.ferreira@workus.dev',
    position: 'QA Engineer',
    startedDaysAgo: 1195,
  },
  {
    firstName: 'Scarlett',
    lastName: 'Novotny',
    email: 'scarlett.novotny@workus.dev',
    position: 'Project Manager',
    startedDaysAgo: 1179,
  },
  {
    firstName: 'Jack',
    lastName: 'Lambert',
    email: 'jack.lambert@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 1132,
  },
  {
    firstName: 'Aria',
    lastName: 'Sato',
    email: 'aria.sato@workus.dev',
    position: 'AI Engineer',
    startedDaysAgo: 1100,
  },
  {
    firstName: 'Mateo',
    lastName: 'Gruber',
    email: 'mateo.gruber@workus.dev',
    position: 'Full Stack Developer',
    startedDaysAgo: 165,
    terminatedDaysAgo: 5,
    terminationReason: 'OTHER',
    terminationComment: 'Relocated abroad; may return as a contractor',
  },
  {
    firstName: 'Nora',
    lastName: 'Kovac',
    email: 'nora.kovac@workus.dev',
    position: 'QA Automation Engineer',
    startedDaysAgo: 140,
  },
  {
    firstName: 'Leo',
    lastName: 'Duarte',
    email: 'leo.duarte@workus.dev',
    position: 'Frontend Developer',
    startedDaysAgo: 120,
    isUnassigned: true,
  },
  {
    firstName: 'Hannah',
    lastName: 'Becker',
    email: 'hannah.becker@workus.dev',
    position: 'Product Designer',
    startedDaysAgo: 88,
    isUnassigned: true,
  },
  {
    firstName: 'Gabriel',
    lastName: 'Mendes',
    email: 'gabriel.mendes@workus.dev',
    position: 'Data Scientist',
    startedDaysAgo: 70,
  },
  {
    firstName: 'Layla',
    lastName: 'Haddad',
    email: 'layla.haddad@workus.dev',
    position: 'QA Engineer',
    startedDaysAgo: 45,
  },
  {
    firstName: 'Ryan',
    lastName: "O'Connell",
    email: 'ryan.oconnell@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 28,
  },
  {
    firstName: 'Mila',
    lastName: 'Popescu',
    email: 'mila.popescu@workus.dev',
    position: 'Mobile Developer',
    startedDaysAgo: 21,
  },
  {
    firstName: 'Adam',
    lastName: 'Schulz',
    email: 'adam.schulz@workus.dev',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 14,
  },
  {
    firstName: 'Victoria',
    lastName: 'Lund',
    email: 'victoria.lund@workus.dev',
    position: 'QA Engineer',
    startedDaysAgo: 7,
  },
  {
    firstName: 'Theo',
    lastName: 'Ivanov',
    email: 'theo.ivanov@workus.dev',
    position: 'Frontend Developer',
    startedDaysAgo: 3,
  },
];

const CITIES = [
  { city: 'Berlin', postcode: '10115', street: 'Lindenweg' },
  { city: 'Lisbon', postcode: '1100-148', street: 'Rua das Flores' },
  { city: 'Warsaw', postcode: '00-001', street: 'Ulica Sosnowa' },
  { city: 'Amsterdam', postcode: '1012 AB', street: 'Kastanjelaan' },
  { city: 'Prague', postcode: '110 00', street: 'Lipová' },
  { city: 'Vienna', postcode: '1010', street: 'Ahorngasse' },
] as const;

export interface SeedContacts {
  mobile: string | null;
  personalEmail: string | null;
  linkedinUrl: string | null;
  telegram: string | null;
  address: string | null;
}

const slug = (employee: SeedEmployee): string =>
  `${employee.firstName}-${employee.lastName}`.toLowerCase().replace(/[^a-z-]/g, '');

/**
 * Fictional contacts that cannot reach a real person: phone numbers from the Ofcom range
 * reserved for drama (+44 7700 900xxx), personal emails on example.com, demo-prefixed handles.
 * Some people leave fields empty, as they would in real life.
 */
export const contactsFor = (employee: SeedEmployee, index: number): SeedContacts => {
  const place = CITIES[index % CITIES.length] ?? CITIES[0];
  return {
    mobile: index % 7 === 6 ? null : `+44 7700 900${String(100 + index * 7).padStart(3, '0')}`,
    personalEmail: index % 4 === 3 ? null : `${slug(employee).replace('-', '.')}@example.com`,
    linkedinUrl:
      index % 3 === 2 ? null : `https://www.linkedin.com/in/workus-demo-${slug(employee)}`,
    telegram:
      index % 5 === 4 ? null : `@workus_demo_${slug(employee).replace(/-/g, '_')}`.slice(0, 33),
    address:
      index % 6 === 5
        ? null
        : `${String(3 + ((index * 11) % 90))} ${place.street}, ${place.postcode} ${place.city}`,
  };
};
