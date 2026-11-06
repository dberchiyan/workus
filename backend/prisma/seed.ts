import 'reflect-metadata';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { PrismaClient } from '../src/generated/prisma/client';
import { PasswordHasher } from '../src/modules/auth/service/password-hasher.service';
import { UserRole } from '../src/modules/user/service/user-role';
import { ADMINS, EMPLOYEES, POSITION_CATEGORIES } from './seed-data';

/**
 * Development seed (APP_ENV=dev only): 2 admins and 40 employees sharing SEED_USER_PASSWORD,
 * position categories and positions, responsibles. Idempotent — existing rows are kept.
 */
const seedEnv = z.object({
  APP_ENV: z.literal('dev'),
  DATABASE_URL: z.url(),
  SEED_USER_PASSWORD: z.string().min(12).max(128),
});

const DAY_MS = 86_400_000;

/** Today (UTC) minus `days`, as a date-only value. */
const daysAgo = (days: number): Date => {
  const today = new Date();
  return new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - days * DAY_MS,
  );
};

const MANAGER_POSITIONS = new Set(['Project Manager', 'Delivery Manager']);

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
  try {
    const passwordHash = await new PasswordHasher().hash(env.SEED_USER_PASSWORD);
    const users = await prisma.user.createMany({
      data: [
        ...ADMINS.map((admin) => ({ ...admin, role: UserRole.ADMIN, passwordHash })),
        ...EMPLOYEES.map(({ firstName, lastName, email }) => ({
          firstName,
          lastName,
          email,
          role: UserRole.EMPLOYEE,
          passwordHash,
        })),
      ],
      skipDuplicates: true,
    });

    for (const [index, category] of POSITION_CATEGORIES.entries()) {
      const { id: categoryId } = await prisma.positionCategory.upsert({
        where: { name: category.name },
        create: { name: category.name, sortOrder: index },
        update: {},
        select: { id: true },
      });
      await prisma.position.createMany({
        data: category.positions.map((title) => ({ title, categoryId })),
        skipDuplicates: true,
      });
    }

    const emails = [...ADMINS, ...EMPLOYEES].map((person) => person.email);
    const userIdByEmail = new Map(
      (
        await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { id: true, email: true },
        })
      ).map((user) => [user.email, user.id]),
    );
    const positionIdByTitle = new Map(
      (await prisma.position.findMany({ select: { id: true, title: true } })).map((position) => [
        position.title,
        position.id,
      ]),
    );
    const idOf = (map: Map<string, string>, key: string): string => {
      const id = map.get(key);
      if (!id) {
        throw new Error(`Seed reference not found: ${key}`);
      }
      return id;
    };

    const employees = await prisma.employee.createMany({
      data: EMPLOYEES.map((employee) => ({
        userId: idOf(userIdByEmail, employee.email),
        positionId: idOf(positionIdByTitle, employee.position),
        startDate: daysAgo(employee.startedDaysAgo),
        terminatedOn:
          employee.terminatedDaysAgo === undefined ? null : daysAgo(employee.terminatedDaysAgo),
      })),
      skipDuplicates: true,
    });

    // Managers answer to an admin; everyone else to a manager (rotating) and every third also to an admin.
    const admins = ADMINS.map((admin) => idOf(userIdByEmail, admin.email));
    const managers = EMPLOYEES.filter((e) => MANAGER_POSITIONS.has(e.position)).map((e) =>
      idOf(userIdByEmail, e.email),
    );
    const employeeIdByUserId = new Map(
      (await prisma.employee.findMany({ select: { id: true, userId: true } })).map((e) => [
        e.userId,
        e.id,
      ]),
    );
    const unassigned = EMPLOYEES.filter((e) => e.isUnassigned).map((e) =>
      idOf(employeeIdByUserId, idOf(userIdByEmail, e.email)),
    );
    await prisma.employeeResponsible.deleteMany({ where: { employeeId: { in: unassigned } } });
    const assignments = EMPLOYEES.flatMap((employee, index) => {
      if (employee.isUnassigned) {
        return [];
      }
      const employeeId = idOf(employeeIdByUserId, idOf(userIdByEmail, employee.email));
      const admin = admins[index % admins.length] ?? '';
      if (MANAGER_POSITIONS.has(employee.position)) {
        return [{ employeeId, responsibleUserId: admin }];
      }
      const manager = managers[index % managers.length] ?? admin;
      return index % 3 === 0
        ? [
            { employeeId, responsibleUserId: manager },
            { employeeId, responsibleUserId: admin },
          ]
        : [{ employeeId, responsibleUserId: manager }];
    });
    const responsibles = await prisma.employeeResponsible.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    process.stdout.write(
      `Seeded ${users.count} users, ${employees.count} employees, ${responsibles.count} responsibles\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
};

void seed();
