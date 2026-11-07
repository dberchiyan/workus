import 'reflect-metadata';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { PrismaClient } from '../src/generated/prisma/client';
import { PasswordHasher } from '../src/modules/auth/service/password-hasher.service';
import { UserRole } from '../src/modules/user/service/user-role';
import { databaseUrl } from '../src/common/config/database-url';
import { ADMINS, contactsFor, EMPLOYEES, POSITION_CATEGORIES, SEED_PASSWORD } from './seed-data';
import { seedActivity } from './seed-activity';
import { seedHolidays } from './seed-holidays';
import { seedReviews } from './seed-reviews';
import {
  alignPendingResponsibles,
  seedPendingRequests,
  seedTimeOff,
  seedTimeOffComments,
} from './seed-time-off';

/**
 * Development seed (APP_ENV=dev only): admins and employees sharing SEED_PASSWORD, position
 * categories and positions, responsibles. Idempotent — existing rows are kept.
 */
const seedEnv = z.object({
  APP_ENV: z.literal('dev'),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USERNAME: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
});

const DAY_MS = 86_400_000;

/** Today (UTC) minus `days`, as a date-only value. */
const daysAgo = (days: number): Date => {
  const today = new Date();
  return new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - days * DAY_MS,
  );
};

const seed = async (): Promise<void> => {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Variables come from the environment.
  }
  const env = seedEnv.parse(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl({
        host: env.DATABASE_HOST,
        port: env.DATABASE_PORT,
        name: env.DATABASE_NAME,
        username: env.DATABASE_USERNAME,
        password: env.DATABASE_PASSWORD,
      }),
    }),
  });
  try {
    const passwordHash = await new PasswordHasher().hash(SEED_PASSWORD);
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
        terminationReason: employee.terminationReason ?? null,
        terminationComment: employee.terminationComment ?? null,
      })),
      skipDuplicates: true,
    });

    // Only admins are responsible: one each (rotating), every third person both. Responsibles who
    // are not admins (left from earlier seeds) are removed; past reviews and requests keep theirs.
    const admins = ADMINS.map((admin) => idOf(userIdByEmail, admin.email));
    const employeeIdByUserId = new Map(
      (await prisma.employee.findMany({ select: { id: true, userId: true } })).map((e) => [
        e.userId,
        e.id,
      ]),
    );
    const unassigned = EMPLOYEES.filter((e) => e.isUnassigned).map((e) =>
      idOf(employeeIdByUserId, idOf(userIdByEmail, e.email)),
    );
    await prisma.employeeResponsible.deleteMany({
      where: {
        OR: [{ employeeId: { in: unassigned } }, { responsible: { role: { not: 'ADMIN' } } }],
      },
    });
    const assignments = EMPLOYEES.flatMap((employee, index) => {
      if (employee.isUnassigned) {
        return [];
      }
      const employeeId = idOf(employeeIdByUserId, idOf(userIdByEmail, employee.email));
      return (index % 3 === 0 ? admins : [admins[index % admins.length] ?? '']).map(
        (responsibleUserId) => ({ employeeId, responsibleUserId }),
      );
    });
    const responsibles = await prisma.employeeResponsible.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    // Contacts only where none are set yet, so edits made in the app survive a re-seed.
    let contacts = 0;
    for (const [index, employee] of EMPLOYEES.entries()) {
      const { count } = await prisma.employee.updateMany({
        where: {
          userId: idOf(userIdByEmail, employee.email),
          mobile: null,
          personalEmail: null,
          linkedinUrl: null,
          telegram: null,
          address: null,
        },
        data: contactsFor(employee, index),
      });
      contacts += count;
    }

    // Dates of birth where none is set (edits made in the app survive a re-seed): every ninth
    // person has a birthday on the seed day, every ninth from the fifth later this month.
    const today = daysAgo(0);
    let birthDates = 0;
    for (const [index, employee] of EMPLOYEES.entries()) {
      const year = 1975 + ((index * 7) % 26);
      const lastDay = new Date(Date.UTC(year, today.getUTCMonth() + 1, 0)).getUTCDate();
      const [month, day] =
        index % 9 === 0
          ? [today.getUTCMonth(), Math.min(today.getUTCDate(), lastDay)]
          : index % 9 === 4
            ? [today.getUTCMonth(), 1 + ((index * 5) % lastDay)]
            : [(index * 5) % 12, 1 + ((index * 11) % 28)];
      const { count } = await prisma.employee.updateMany({
        where: { userId: idOf(userIdByEmail, employee.email), dateOfBirth: null },
        data: { dateOfBirth: new Date(Date.UTC(year, month, day)) },
      });
      birthDates += count;
    }

    const seededEmployees = await prisma.employee.findMany({
      where: { userId: { in: EMPLOYEES.map((employee) => idOf(userIdByEmail, employee.email)) } },
      select: {
        id: true,
        startDate: true,
        terminatedOn: true,
        position: { select: { category: { select: { name: true } } } },
        responsibles: { select: { responsibleUserId: true }, take: 10 },
      },
      orderBy: { startDate: 'asc' },
    });
    const reviews = await seedReviews(
      prisma,
      seededEmployees.map((employee) => ({
        id: employee.id,
        startDate: employee.startDate,
        terminatedOn: employee.terminatedOn,
        categoryName: employee.position.category.name,
        responsibleUserIds: employee.responsibles.map((r) => r.responsibleUserId),
      })),
      admins[0] ?? '',
    );

    const activity = await seedActivity(prisma, admins);
    const timeOff = await seedTimeOff(prisma, admins[0] ?? '');
    const pending = await seedPendingRequests(prisma, admins[0] ?? '');
    const realigned = await alignPendingResponsibles(prisma);
    const comments = await seedTimeOffComments(prisma, admins);
    // After the requests, so the ones covering a new holiday give its working day back.
    const holidays = await seedHolidays(prisma);

    process.stdout.write(
      `Seeded ${holidays} holidays, ${timeOff} time-off requests (pending: ${pending.created} added, ${pending.decided} decided; ${realigned} pending realigned to admins, ${comments} comments), ${activity} activity events, ${reviews} reviews, ${users.count} users, ${employees.count} employees, ${responsibles.count} responsibles, contacts for ${contacts}, dates of birth for ${birthDates}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
};

void seed();
