import 'reflect-metadata';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { PrismaClient } from '../src/generated/prisma/client';
import { PasswordHasher } from '../src/modules/auth/service/password-hasher.service';
import { UserRole } from '../src/modules/user/service/user-role';
import { databaseUrl } from '../src/common/config/database-url';
import {
  contactsFor,
  ORGANISATIONS,
  PLATFORM_ADMINS,
  PLATFORM_ID,
  POSITION_CATEGORIES,
  SEED_PASSWORD,
  type SeedOrganisation,
} from './seed-data';
import { seedActivity } from './seed-activity';
import { seedHolidays } from './seed-holidays';
import { seedNotifications } from './seed-notifications';
import { seedReviews } from './seed-reviews';
import { seedSecurityLog } from './seed-security';
import {
  alignPendingResponsibles,
  seedPendingRequests,
  seedTimeOff,
  seedTimeOffComments,
} from './seed-time-off';

/**
 * Development seed (APP_ENV=dev only): two organisations (OSDB, Vortex), each with an owner,
 * admins and employees sharing SEED_PASSWORD, responsibles, reviews, time off, holidays and
 * notifications; a security log for every employee; the shared catalogue of position
 * categories and positions. Idempotent — existing rows are kept.
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

/** One organisation's people and data; returns a summary line. Idempotent. */
const seedOrganisation = async (
  prisma: PrismaClient,
  organisation: SeedOrganisation,
  passwordHash: string,
): Promise<string> => {
  const organisationId = organisation.id;
  await prisma.organisation.upsert({
    where: { id: organisationId },
    create: { id: organisationId, name: organisation.name, status: organisation.status },
    update: {},
    select: { id: true },
  });
  const { owners, admins: adminPeople, employees: people } = organisation;
  const users = await prisma.user.createMany({
    data: [
      ...owners.map((owner) => ({ ...owner, role: UserRole.OWNER })),
      ...adminPeople.map((admin) => ({ ...admin, role: UserRole.ADMIN })),
      ...people.map(({ firstName, lastName, email }) => ({
        firstName,
        lastName,
        email,
        role: UserRole.EMPLOYEE,
      })),
    ].map((user) => ({ ...user, organisationId, passwordHash })),
    skipDuplicates: true,
  });

  const emails = [...owners, ...adminPeople, ...people].map((person) => person.email);
  const userIdByEmail = new Map(
    (
      await prisma.user.findMany({
        where: { organisationId, email: { in: emails } },
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
    data: people.map((employee) => ({
      organisationId,
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
  // are not administrators (left from earlier seeds) are removed; past reviews and requests keep
  // theirs.
  const admins = adminPeople.map((admin) => idOf(userIdByEmail, admin.email));
  const employeeIdByUserId = new Map(
    (
      await prisma.employee.findMany({
        where: { organisationId },
        select: { id: true, userId: true },
      })
    ).map((e) => [e.userId, e.id]),
  );
  const unassigned = people
    .filter((e) => e.isUnassigned)
    .map((e) => idOf(employeeIdByUserId, idOf(userIdByEmail, e.email)));
  await prisma.employeeResponsible.deleteMany({
    where: {
      organisationId,
      OR: [
        { employeeId: { in: unassigned } },
        { responsible: { role: { notIn: [UserRole.OWNER, UserRole.ADMIN] } } },
      ],
    },
  });
  const assignments = people.flatMap((employee, index) => {
    if (employee.isUnassigned) {
      return [];
    }
    const employeeId = idOf(employeeIdByUserId, idOf(userIdByEmail, employee.email));
    return (index % 3 === 0 ? admins : [admins[index % admins.length] ?? '']).map(
      (responsibleUserId) => ({ organisationId, employeeId, responsibleUserId }),
    );
  });
  const responsibles = await prisma.employeeResponsible.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  // Contacts only where none are set yet, so edits made in the app survive a re-seed.
  let contacts = 0;
  for (const [index, employee] of people.entries()) {
    const { count } = await prisma.employee.updateMany({
      where: {
        organisationId,
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
  for (const [index, employee] of people.entries()) {
    const year = 1975 + ((index * 7) % 26);
    const lastDay = new Date(Date.UTC(year, today.getUTCMonth() + 1, 0)).getUTCDate();
    const [month, day] =
      index % 9 === 0
        ? [today.getUTCMonth(), Math.min(today.getUTCDate(), lastDay)]
        : index % 9 === 4
          ? [today.getUTCMonth(), 1 + ((index * 5) % lastDay)]
          : [(index * 5) % 12, 1 + ((index * 11) % 28)];
    const { count } = await prisma.employee.updateMany({
      where: { organisationId, userId: idOf(userIdByEmail, employee.email), dateOfBirth: null },
      data: { dateOfBirth: new Date(Date.UTC(year, month, day)) },
    });
    birthDates += count;
  }

  const seededEmployees = await prisma.employee.findMany({
    where: {
      organisationId,
      userId: { in: people.map((employee) => idOf(userIdByEmail, employee.email)) },
    },
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
    organisationId,
    seededEmployees.map((employee) => ({
      id: employee.id,
      startDate: employee.startDate,
      terminatedOn: employee.terminatedOn,
      categoryName: employee.position.category.name,
      responsibleUserIds: employee.responsibles.map((r) => r.responsibleUserId),
    })),
    admins[0] ?? '',
  );

  const activity = await seedActivity(prisma, organisationId, admins);
  const timeOff = await seedTimeOff(prisma, organisationId, admins[0] ?? '');
  const pending = await seedPendingRequests(prisma, organisationId, admins[0] ?? '');
  const realigned = await alignPendingResponsibles(prisma, organisationId);
  const comments = await seedTimeOffComments(prisma, organisationId, admins);
  // After the requests, so the ones covering a new holiday give its working day back.
  const holidays = await seedHolidays(prisma, organisationId);
  const notifications = await seedNotifications(prisma, organisationId);
  const security = await seedSecurityLog(prisma, organisationId);

  return `${security} security events, ${notifications} notifications, ${holidays} holidays, ${timeOff} time-off requests (pending: ${pending.created} added, ${pending.decided} decided; ${realigned} pending realigned to admins, ${comments} comments), ${activity} activity events, ${reviews} reviews, ${users.count} users, ${employees.count} employees, ${responsibles.count} responsibles, contacts for ${contacts}, dates of birth for ${birthDates}`;
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
    // Positions are a shared catalogue of job titles: every organisation picks from it.
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
    // Platform admins: the internal organisation, no tenant data.
    const platform = await prisma.user.createMany({
      data: PLATFORM_ADMINS.map((admin) => ({
        ...admin,
        organisationId: PLATFORM_ID,
        role: UserRole.PLATFORM_ADMIN,
        passwordHash,
      })),
      skipDuplicates: true,
    });
    process.stdout.write(`Platform: ${platform.count} platform admins\n`);
    for (const organisation of ORGANISATIONS) {
      process.stdout.write(
        `${organisation.name}: ${await seedOrganisation(prisma, organisation, passwordHash)}\n`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
};

void seed();
