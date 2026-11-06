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
  /** Start date as days before the seed run. */
  startedDaysAgo: number;
  /** Termination as days before the seed run; absent → active. */
  terminatedDaysAgo?: number;
  /** Nobody is responsible yet (shows on the "No responsible" card). */
  isUnassigned?: true;
}

export const EMPLOYEES: SeedEmployee[] = [
  {
    firstName: 'Ava',
    lastName: 'Thompson',
    email: 'ava.thompson@workus.dev',
    position: 'Frontend Developer',
    startedDaysAgo: 812,
  },
  {
    firstName: 'Liam',
    lastName: 'Carter',
    email: 'liam.carter@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 640,
  },
  {
    firstName: 'Sofia',
    lastName: 'Martinez',
    email: 'sofia.martinez@workus.dev',
    position: 'Product Designer',
    startedDaysAgo: 455,
  },
  {
    firstName: 'Noah',
    lastName: 'Kim',
    email: 'noah.kim@workus.dev',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 390,
  },
  {
    firstName: 'Emma',
    lastName: 'Novak',
    email: 'emma.novak@workus.dev',
    position: 'QA Engineer',
    startedDaysAgo: 301,
  },
  {
    firstName: 'Lucas',
    lastName: 'Fischer',
    email: 'lucas.fischer@workus.dev',
    position: 'Project Manager',
    startedDaysAgo: 980,
  },
  {
    firstName: 'Mia',
    lastName: 'Rossi',
    email: 'mia.rossi@workus.dev',
    position: 'Full Stack Developer',
    startedDaysAgo: 210,
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
    startedDaysAgo: 1100,
  },
  {
    firstName: 'James',
    lastName: 'Okafor',
    email: 'james.okafor@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 1020,
  },
  {
    firstName: 'Grace',
    lastName: 'Lindqvist',
    email: 'grace.lindqvist@workus.dev',
    position: 'Project Manager',
    startedDaysAgo: 760,
  },
  {
    firstName: 'Henry',
    lastName: 'Silva',
    email: 'henry.silva@workus.dev',
    position: 'Frontend Developer',
    startedDaysAgo: 700,
  },
  {
    firstName: 'Zoe',
    lastName: 'Hartmann',
    email: 'zoe.hartmann@workus.dev',
    position: 'AI Engineer',
    startedDaysAgo: 520,
  },
  {
    firstName: 'Samuel',
    lastName: 'Petrov',
    email: 'samuel.petrov@workus.dev',
    position: 'Full Stack Developer',
    startedDaysAgo: 480,
  },
  {
    firstName: 'Lily',
    lastName: 'Andersen',
    email: 'lily.andersen@workus.dev',
    position: 'QA Engineer',
    startedDaysAgo: 470,
    terminatedDaysAgo: 60,
  },
  {
    firstName: 'Oliver',
    lastName: 'Nakamura',
    email: 'oliver.nakamura@workus.dev',
    position: 'Data Scientist',
    startedDaysAgo: 430,
  },
  {
    firstName: 'Amelia',
    lastName: 'Costa',
    email: 'amelia.costa@workus.dev',
    position: 'Product Designer',
    startedDaysAgo: 410,
  },
  {
    firstName: 'Benjamin',
    lastName: 'Varga',
    email: 'benjamin.varga@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 365,
    terminatedDaysAgo: 20,
  },
  {
    firstName: 'Harper',
    lastName: 'Jensen',
    email: 'harper.jensen@workus.dev',
    position: 'QA Automation Engineer',
    startedDaysAgo: 340,
  },
  {
    firstName: 'Elijah',
    lastName: 'Brooks',
    email: 'elijah.brooks@workus.dev',
    position: 'Mobile Developer',
    startedDaysAgo: 330,
  },
  {
    firstName: 'Evelyn',
    lastName: 'Horvat',
    email: 'evelyn.horvat@workus.dev',
    position: 'Machine Learning Engineer',
    startedDaysAgo: 290,
  },
  {
    firstName: 'Alexander',
    lastName: 'Byrne',
    email: 'alexander.byrne@workus.dev',
    position: 'Frontend Developer',
    startedDaysAgo: 275,
  },
  {
    firstName: 'Ella',
    lastName: 'Marchetti',
    email: 'ella.marchetti@workus.dev',
    position: 'UI/UX Designer',
    startedDaysAgo: 260,
    terminatedDaysAgo: 110,
  },
  {
    firstName: 'William',
    lastName: 'Ferreira',
    email: 'william.ferreira@workus.dev',
    position: 'QA Engineer',
    startedDaysAgo: 240,
  },
  {
    firstName: 'Scarlett',
    lastName: 'Novotny',
    email: 'scarlett.novotny@workus.dev',
    position: 'Project Manager',
    startedDaysAgo: 230,
  },
  {
    firstName: 'Jack',
    lastName: 'Lambert',
    email: 'jack.lambert@workus.dev',
    position: 'Backend Developer',
    startedDaysAgo: 200,
  },
  {
    firstName: 'Aria',
    lastName: 'Sato',
    email: 'aria.sato@workus.dev',
    position: 'AI Engineer',
    startedDaysAgo: 180,
  },
  {
    firstName: 'Mateo',
    lastName: 'Gruber',
    email: 'mateo.gruber@workus.dev',
    position: 'Full Stack Developer',
    startedDaysAgo: 165,
    terminatedDaysAgo: 5,
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
