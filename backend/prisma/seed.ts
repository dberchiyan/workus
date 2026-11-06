import 'reflect-metadata';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { PrismaClient } from '../src/generated/prisma/client';
import { PasswordHasher } from '../src/modules/auth/service/password-hasher.service';
import { UserRole } from '../src/modules/user/service/user-role';

/** Development seed (APP_ENV=dev only): 2 admins and 10 employees sharing SEED_USER_PASSWORD. */
const seedEnv = z.object({
  APP_ENV: z.literal('dev'),
  DATABASE_URL: z.url(),
  SEED_USER_PASSWORD: z.string().min(12).max(128),
});

const ADMINS = [
  { firstName: 'Olivia', lastName: 'Bennett' },
  { firstName: 'Marcus', lastName: 'Reid' },
];

const EMPLOYEES = [
  { firstName: 'Ava', lastName: 'Thompson' },
  { firstName: 'Liam', lastName: 'Carter' },
  { firstName: 'Sofia', lastName: 'Martinez' },
  { firstName: 'Noah', lastName: 'Kim' },
  { firstName: 'Emma', lastName: 'Novak' },
  { firstName: 'Lucas', lastName: 'Fischer' },
  { firstName: 'Mia', lastName: 'Rossi' },
  { firstName: 'Ethan', lastName: 'Walsh' },
  { firstName: 'Chloe', lastName: 'Dubois' },
  { firstName: 'Daniel', lastName: 'Kowalski' },
];

const seed = async (): Promise<void> => {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Variables come from the environment.
  }
  const env = seedEnv.parse(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  const passwordHash = await new PasswordHasher().hash(env.SEED_USER_PASSWORD);
  const users = [
    ...ADMINS.map((person, index) => ({
      ...person,
      role: UserRole.ADMIN,
      email: `admin${index + 1}@workus.dev`,
    })),
    ...EMPLOYEES.map((person, index) => ({
      ...person,
      role: UserRole.EMPLOYEE,
      email: `employee${index + 1}@workus.dev`,
    })),
  ];
  try {
    const { count } = await prisma.user.createMany({
      data: users.map((user) => ({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash,
      })),
      skipDuplicates: true,
    });
    process.stdout.write(`Seeded ${count} new users (${users.length} defined)\n`);
  } finally {
    await prisma.$disconnect();
  }
};

void seed();
