/** Development seed data — fictional people only. */

/**
 * Password of every seeded account. Public on purpose: the accounts are fictional and the seed
 * runs only with APP_ENV=dev, so they never exist outside a developer's database.
 */
export const SEED_PASSWORD = 'Workus-Dev-2026!';

export interface SeedPerson {
  firstName: string;
  lastName: string;
  email: string;
}

/** OSDB: the first organisation (its id is fixed by the tenancy migration). */
export const OSDB_ID = '01960000-0000-7000-8000-000000000001';
/** Vortex: a second, smaller company — nothing is shared with OSDB. */
export const VORTEX_ID = '01960000-0000-7000-8000-000000000002';
/** Lumen Studio: registered, waiting for a platform admin's approval. */
export const LUMEN_ID = '01960000-0000-7000-8000-000000000003';

export const OSDB_OWNERS: SeedPerson[] = [
  { firstName: 'Sophia', lastName: 'Carter', email: 'sophia.carter@osdb.io' },
];

export const ADMINS: SeedPerson[] = [
  { firstName: 'Olivia', lastName: 'Bennett', email: 'olivia.bennett@osdb.io' },
  { firstName: 'Marcus', lastName: 'Reid', email: 'marcus.reid@osdb.io' },
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
    email: 'ava.thompson@osdb.io',
    position: 'Frontend Developer',
    startedDaysAgo: 2100,
  },
  {
    firstName: 'Liam',
    lastName: 'Carter',
    email: 'liam.carter@osdb.io',
    position: 'Backend Developer',
    startedDaysAgo: 1828,
  },
  {
    firstName: 'Sofia',
    lastName: 'Martinez',
    email: 'sofia.martinez@osdb.io',
    position: 'Product Designer',
    startedDaysAgo: 1535,
  },
  {
    firstName: 'Noah',
    lastName: 'Kim',
    email: 'noah.kim@osdb.io',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 1432,
  },
  {
    firstName: 'Emma',
    lastName: 'Novak',
    email: 'emma.novak@osdb.io',
    position: 'QA Engineer',
    startedDaysAgo: 1291,
  },
  {
    firstName: 'Lucas',
    lastName: 'Fischer',
    email: 'lucas.fischer@osdb.io',
    position: 'Project Manager',
    startedDaysAgo: 2365,
  },
  {
    firstName: 'Mia',
    lastName: 'Rossi',
    email: 'mia.rossi@osdb.io',
    position: 'Full Stack Developer',
    startedDaysAgo: 1147,
  },
  {
    firstName: 'Ethan',
    lastName: 'Walsh',
    email: 'ethan.walsh@osdb.io',
    position: 'Mobile Developer',
    startedDaysAgo: 150,
  },
  {
    firstName: 'Chloe',
    lastName: 'Dubois',
    email: 'chloe.dubois@osdb.io',
    position: 'UI/UX Designer',
    startedDaysAgo: 95,
  },
  {
    firstName: 'Daniel',
    lastName: 'Kowalski',
    email: 'daniel.kowalski@osdb.io',
    position: 'QA Automation Engineer',
    startedDaysAgo: 12,
  },
  {
    firstName: 'Isabella',
    lastName: 'Moreau',
    email: 'isabella.moreau@osdb.io',
    position: 'Delivery Manager',
    startedDaysAgo: 2555,
  },
  {
    firstName: 'James',
    lastName: 'Okafor',
    email: 'james.okafor@osdb.io',
    position: 'Backend Developer',
    startedDaysAgo: 2428,
  },
  {
    firstName: 'Grace',
    lastName: 'Lindqvist',
    email: 'grace.lindqvist@osdb.io',
    position: 'Project Manager',
    startedDaysAgo: 2017,
  },
  {
    firstName: 'Henry',
    lastName: 'Silva',
    email: 'henry.silva@osdb.io',
    position: 'Frontend Developer',
    startedDaysAgo: 1922,
  },
  {
    firstName: 'Zoe',
    lastName: 'Hartmann',
    email: 'zoe.hartmann@osdb.io',
    position: 'AI Engineer',
    startedDaysAgo: 1638,
  },
  {
    firstName: 'Samuel',
    lastName: 'Petrov',
    email: 'samuel.petrov@osdb.io',
    position: 'Full Stack Developer',
    startedDaysAgo: 1574,
  },
  {
    firstName: 'Lily',
    lastName: 'Andersen',
    email: 'lily.andersen@osdb.io',
    position: 'QA Engineer',
    startedDaysAgo: 1559,
    terminatedDaysAgo: 60,
    terminationReason: 'RESIGNATION',
    terminationComment: 'Moved to another city',
  },
  {
    firstName: 'Oliver',
    lastName: 'Nakamura',
    email: 'oliver.nakamura@osdb.io',
    position: 'Data Scientist',
    startedDaysAgo: 1495,
  },
  {
    firstName: 'Amelia',
    lastName: 'Costa',
    email: 'amelia.costa@osdb.io',
    position: 'Product Designer',
    startedDaysAgo: 1464,
  },
  {
    firstName: 'Benjamin',
    lastName: 'Varga',
    email: 'benjamin.varga@osdb.io',
    position: 'Backend Developer',
    startedDaysAgo: 1393,
    terminatedDaysAgo: 20,
    terminationReason: 'END_OF_CONTRACT',
  },
  {
    firstName: 'Harper',
    lastName: 'Jensen',
    email: 'harper.jensen@osdb.io',
    position: 'QA Automation Engineer',
    startedDaysAgo: 1353,
  },
  {
    firstName: 'Elijah',
    lastName: 'Brooks',
    email: 'elijah.brooks@osdb.io',
    position: 'Mobile Developer',
    startedDaysAgo: 1337,
  },
  {
    firstName: 'Evelyn',
    lastName: 'Horvat',
    email: 'evelyn.horvat@osdb.io',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 1274,
  },
  {
    firstName: 'Alexander',
    lastName: 'Byrne',
    email: 'alexander.byrne@osdb.io',
    position: 'Frontend Developer',
    startedDaysAgo: 1250,
  },
  {
    firstName: 'Ella',
    lastName: 'Marchetti',
    email: 'ella.marchetti@osdb.io',
    position: 'UI/UX Designer',
    startedDaysAgo: 1227,
    terminatedDaysAgo: 110,
    terminationReason: 'LAYOFF',
    terminationComment: 'Project closed',
  },
  {
    firstName: 'William',
    lastName: 'Ferreira',
    email: 'william.ferreira@osdb.io',
    position: 'QA Engineer',
    startedDaysAgo: 1195,
  },
  {
    firstName: 'Scarlett',
    lastName: 'Novotny',
    email: 'scarlett.novotny@osdb.io',
    position: 'Project Manager',
    startedDaysAgo: 1179,
  },
  {
    firstName: 'Jack',
    lastName: 'Lambert',
    email: 'jack.lambert@osdb.io',
    position: 'Backend Developer',
    startedDaysAgo: 1132,
  },
  {
    firstName: 'Aria',
    lastName: 'Sato',
    email: 'aria.sato@osdb.io',
    position: 'AI Engineer',
    startedDaysAgo: 1100,
  },
  {
    firstName: 'Mateo',
    lastName: 'Gruber',
    email: 'mateo.gruber@osdb.io',
    position: 'Full Stack Developer',
    startedDaysAgo: 165,
    terminatedDaysAgo: 5,
    terminationReason: 'OTHER',
    terminationComment: 'Relocated abroad; may return as a contractor',
  },
  {
    firstName: 'Nora',
    lastName: 'Kovac',
    email: 'nora.kovac@osdb.io',
    position: 'QA Automation Engineer',
    startedDaysAgo: 140,
  },
  {
    firstName: 'Leo',
    lastName: 'Duarte',
    email: 'leo.duarte@osdb.io',
    position: 'Frontend Developer',
    startedDaysAgo: 120,
    isUnassigned: true,
  },
  {
    firstName: 'Hannah',
    lastName: 'Becker',
    email: 'hannah.becker@osdb.io',
    position: 'Product Designer',
    startedDaysAgo: 88,
    isUnassigned: true,
  },
  {
    firstName: 'Gabriel',
    lastName: 'Mendes',
    email: 'gabriel.mendes@osdb.io',
    position: 'Data Scientist',
    startedDaysAgo: 70,
  },
  {
    firstName: 'Layla',
    lastName: 'Haddad',
    email: 'layla.haddad@osdb.io',
    position: 'QA Engineer',
    startedDaysAgo: 45,
  },
  {
    firstName: 'Ryan',
    lastName: "O'Connell",
    email: 'ryan.oconnell@osdb.io',
    position: 'Backend Developer',
    startedDaysAgo: 28,
  },
  {
    firstName: 'Mila',
    lastName: 'Popescu',
    email: 'mila.popescu@osdb.io',
    position: 'Mobile Developer',
    startedDaysAgo: 21,
  },
  {
    firstName: 'Adam',
    lastName: 'Schulz',
    email: 'adam.schulz@osdb.io',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 14,
  },
  {
    firstName: 'Victoria',
    lastName: 'Lund',
    email: 'victoria.lund@osdb.io',
    position: 'QA Engineer',
    startedDaysAgo: 7,
  },
  {
    firstName: 'Theo',
    lastName: 'Ivanov',
    email: 'theo.ivanov@osdb.io',
    position: 'Frontend Developer',
    startedDaysAgo: 3,
  },
  // Joining and leaving soon (the admin dashboard's "Joining & leaving").
  {
    firstName: 'Nora',
    lastName: 'Starling',
    email: 'nora.starling@osdb.io',
    position: 'Product Designer',
    startedDaysAgo: -9,
  },
  {
    firstName: 'Felix',
    lastName: 'Brandt',
    email: 'felix.brandt@osdb.io',
    position: 'Backend Developer',
    startedDaysAgo: -23,
  },
  {
    firstName: 'Clara',
    lastName: 'Weiss',
    email: 'clara.weiss@osdb.io',
    position: 'Data Scientist',
    startedDaysAgo: 1460,
    terminatedDaysAgo: -18,
    terminationReason: 'RESIGNATION',
    terminationComment: 'Moving to research',
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

export const VORTEX_OWNERS: SeedPerson[] = [
  { firstName: 'Liam', lastName: 'Foster', email: 'liam.foster@vortex.io' },
];

export const VORTEX_ADMINS: SeedPerson[] = [
  { firstName: 'Hannah', lastName: 'Brooks', email: 'hannah.brooks@vortex.io' },
  { firstName: 'Ryan', lastName: 'Fletcher', email: 'ryan.fletcher@vortex.io' },
  { firstName: 'Sofia', lastName: 'Marin', email: 'sofia.marin@vortex.io' },
];

export const VORTEX_EMPLOYEES: SeedEmployee[] = [
  {
    firstName: 'Ethan',
    lastName: 'Cole',
    email: 'ethan.cole@vortex.io',
    position: 'Backend Developer',
    startedDaysAgo: 1500,
  },
  {
    firstName: 'Grace',
    lastName: 'Turner',
    email: 'grace.turner@vortex.io',
    position: 'Product Designer',
    startedDaysAgo: 1100,
  },
  {
    firstName: 'Oliver',
    lastName: 'Hayes',
    email: 'oliver.hayes@vortex.io',
    position: 'Frontend Developer',
    startedDaysAgo: 900,
  },
  {
    firstName: 'Mia',
    lastName: 'Sullivan',
    email: 'mia.sullivan@vortex.io',
    position: 'QA Engineer',
    startedDaysAgo: 700,
  },
  {
    firstName: 'Lucas',
    lastName: 'Ward',
    email: 'lucas.ward@vortex.io',
    position: 'Data Scientist',
    startedDaysAgo: 450,
  },
  {
    firstName: 'Chloe',
    lastName: 'Price',
    email: 'chloe.price@vortex.io',
    position: 'Project Manager',
    startedDaysAgo: 1300,
    terminatedDaysAgo: 40,
    terminationReason: 'RESIGNATION',
  },
  {
    firstName: 'Owen',
    lastName: 'Bishop',
    email: 'owen.bishop@vortex.io',
    position: 'Mobile Developer',
    startedDaysAgo: 20,
    isUnassigned: true,
  },
  {
    firstName: 'Amelia',
    lastName: 'Ross',
    email: 'amelia.ross@vortex.io',
    position: 'Frontend Developer',
    startedDaysAgo: 1900,
  },
  {
    firstName: 'Benjamin',
    lastName: 'Hart',
    email: 'benjamin.hart@vortex.io',
    position: 'Backend Developer',
    startedDaysAgo: 1750,
  },
  {
    firstName: 'Charlotte',
    lastName: 'Reyes',
    email: 'charlotte.reyes@vortex.io',
    position: 'Full Stack Developer',
    startedDaysAgo: 1600,
  },
  {
    firstName: 'Daniel',
    lastName: 'Okafor',
    email: 'daniel.okafor@vortex.io',
    position: 'Mobile Developer',
    startedDaysAgo: 1400,
  },
  {
    firstName: 'Ella',
    lastName: 'Chen',
    email: 'ella.chen@vortex.io',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 1200,
  },
  {
    firstName: 'Felix',
    lastName: 'Grant',
    email: 'felix.grant@vortex.io',
    position: 'AI Engineer',
    startedDaysAgo: 980,
  },
  {
    firstName: 'Hazel',
    lastName: 'Morgan',
    email: 'hazel.morgan@vortex.io',
    position: 'Data Scientist',
    startedDaysAgo: 860,
  },
  {
    firstName: 'Isaac',
    lastName: 'Romero',
    email: 'isaac.romero@vortex.io',
    position: 'UI/UX Designer',
    startedDaysAgo: 820,
  },
  {
    firstName: 'Julia',
    lastName: 'Fischer',
    email: 'julia.fischer@vortex.io',
    position: 'Product Designer',
    startedDaysAgo: 760,
  },
  {
    firstName: 'Leo',
    lastName: 'Marshall',
    email: 'leo.marshall@vortex.io',
    position: 'Project Manager',
    startedDaysAgo: 1500,
  },
  {
    firstName: 'Maya',
    lastName: 'Patel',
    email: 'maya.patel@vortex.io',
    position: 'Delivery Manager',
    startedDaysAgo: 1100,
  },
  {
    firstName: 'Nathan',
    lastName: 'Cruz',
    email: 'nathan.cruz@vortex.io',
    position: 'QA Engineer',
    startedDaysAgo: 650,
  },
  {
    firstName: 'Nina',
    lastName: 'Olsen',
    email: 'nina.olsen@vortex.io',
    position: 'QA Automation Engineer',
    startedDaysAgo: 600,
  },
  {
    firstName: 'Oscar',
    lastName: 'Lindgren',
    email: 'oscar.lindgren@vortex.io',
    position: 'Backend Developer',
    startedDaysAgo: 540,
  },
  {
    firstName: 'Priya',
    lastName: 'Shah',
    email: 'priya.shah@vortex.io',
    position: 'Frontend Developer',
    startedDaysAgo: 480,
  },
  {
    firstName: 'Quentin',
    lastName: 'Ferreira',
    email: 'quentin.ferreira@vortex.io',
    position: 'Full Stack Developer',
    startedDaysAgo: 400,
  },
  {
    firstName: 'Ruby',
    lastName: 'Hughes',
    email: 'ruby.hughes@vortex.io',
    position: 'Data Scientist',
    startedDaysAgo: 330,
  },
  {
    firstName: 'Samuel',
    lastName: 'Ortiz',
    email: 'samuel.ortiz@vortex.io',
    position: 'Mobile Developer',
    startedDaysAgo: 260,
  },
  {
    firstName: 'Tessa',
    lastName: 'Kowalczyk',
    email: 'tessa.kowalczyk@vortex.io',
    position: 'Product Designer',
    startedDaysAgo: 190,
  },
  {
    firstName: 'Victor',
    lastName: 'Hansen',
    email: 'victor.hansen@vortex.io',
    position: 'Backend Developer',
    startedDaysAgo: 120,
  },
  {
    firstName: 'Willow',
    lastName: 'Park',
    email: 'willow.park@vortex.io',
    position: 'QA Engineer',
    startedDaysAgo: 45,
  },
  {
    firstName: 'Xavier',
    lastName: 'Lee',
    email: 'xavier.lee@vortex.io',
    position: 'Frontend Developer',
    startedDaysAgo: 18,
  },
  {
    firstName: 'Zoe',
    lastName: 'Mitchell',
    email: 'zoe.mitchell@vortex.io',
    position: 'AI Engineer',
    startedDaysAgo: 1650,
    terminatedDaysAgo: 200,
    terminationReason: 'LAYOFF',
  },
];

export interface SeedOrganisation {
  id: string;
  name: string;
  /** ACTIVE, or PENDING — a sign-up waiting for a platform admin. */
  status: 'ACTIVE' | 'PENDING';
  owners: SeedPerson[];
  /** Responsible for the employees, in turns. */
  admins: SeedPerson[];
  employees: SeedEmployee[];
}

export const ORGANISATIONS: SeedOrganisation[] = [
  {
    id: OSDB_ID,
    name: 'OSDB',
    status: 'ACTIVE',
    owners: OSDB_OWNERS,
    admins: ADMINS,
    employees: EMPLOYEES,
  },
  {
    id: VORTEX_ID,
    name: 'Vortex',
    status: 'ACTIVE',
    owners: VORTEX_OWNERS,
    admins: VORTEX_ADMINS,
    employees: VORTEX_EMPLOYEES,
  },
  /** A sign-up waiting for approval: just its owner, so the platform's queue is never empty. */
  {
    id: LUMEN_ID,
    name: 'Lumen Studio',
    status: 'PENDING',
    owners: [{ firstName: 'Mila', lastName: 'Novak', email: 'mila.novak@lumen.io' }],
    admins: [],
    employees: [],
  },
];

/** The internal organisation of Workus platform admins (created by the approval migration). */
export const PLATFORM_ID = '01960000-0000-7000-8000-000000000000';

export const PLATFORM_ADMINS: SeedPerson[] = [
  { firstName: 'Alex', lastName: 'Morgan', email: 'admin@workus.io' },
];
