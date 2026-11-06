import { Prisma, type PrismaClient } from '../src/generated/prisma/client';
import {
  ReviewKind,
  STARTING_REVIEW_TITLE,
} from '../src/modules/employee/review/service/review-kind';

/** Monthly USD base salary by position category (fictional). */
const BASE_SALARY: Readonly<Record<string, number>> = {
  Developers: 3500,
  'AI Engineers': 4200,
  Designers: 3000,
  'Project Managers': 3800,
  QA: 2800,
};

const FEEDBACK = {
  hr: [
    'Settled into the team quickly and follows processes well.',
    'Great attitude; takes part in company events.',
  ],
  teamLead: [
    'Delivers on time and owns their tasks end to end.',
    'Ready for more responsibility next cycle.',
  ],
  team: ['Helpful in code reviews and always open to questions.', 'Shares knowledge generously.'],
  client: [
    'Communicates clearly and keeps us informed.',
    'The client is happy with the quality of work.',
  ],
} as const;

/** Plain text → a one-paragraph rich-text document (TipTap JSON). */
const doc = (text: string | null | undefined): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  text
    ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
    : Prisma.DbNull;

/** A short bold lead-in followed by a bullet list — shows the formatting in the UI. */
const listDoc = (lead: string, items: readonly string[]): Prisma.InputJsonValue => ({
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: lead, marks: [{ type: 'bold' }] }] },
    {
      type: 'bulletList',
      content: items.map((item) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }],
      })),
    },
  ],
});

const LEAD_POINTS = ['Delivers on time', 'Owns tasks end to end', 'Helps newcomers'] as const;

const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

interface SeedReviewEmployee {
  id: string;
  startDate: Date;
  terminatedOn: Date | null;
  categoryName: string;
  responsibleUserIds: string[];
}

/** Seeded salaries are round: whole hundreds of dollars. */
const roundToHundreds = (amount: Prisma.Decimal): Prisma.Decimal =>
  amount.dividedBy(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).times(100);

/** Every six months; the yearly one is the "Annual review". */
const REVIEW_INTERVAL_MONTHS = 6;

/**
 * The starting salary on the start date, then a completed review every six months (0–6 % raises
 * rounded to whole hundreds, some rounds without one), the next review scheduled for active people and the odd canceled
 * one. Skips employees that have reviews.
 */
export const seedReviews = async (
  prisma: PrismaClient,
  employees: SeedReviewEmployee[],
  fallbackResponsibleId: string,
): Promise<number> => {
  const today = new Date();
  const withReviews = new Set(
    (
      await prisma.employeeReview.groupBy({
        by: ['employeeId'],
        where: { employeeId: { in: employees.map((e) => e.id) } },
        orderBy: { employeeId: 'asc' },
      })
    ).map((group) => group.employeeId),
  );
  let created = 0;
  for (const [index, employee] of employees.entries()) {
    if (withReviews.has(employee.id)) {
      continue;
    }
    const responsibleUserIds =
      employee.responsibleUserIds.length > 0
        ? employee.responsibleUserIds
        : [fallbackResponsibleId];
    // Completed reviews happen up to today, or up to the last day if that came first.
    const end =
      employee.terminatedOn && employee.terminatedOn < today ? employee.terminatedOn : today;
    let salary = new Prisma.Decimal(BASE_SALARY[employee.categoryName] ?? 3000).plus(
      (index % 5) * 100,
    );
    const reviews: Prisma.EmployeeReviewCreateManyInput[] = [
      {
        employeeId: employee.id,
        kind: ReviewKind.STARTING,
        title: STARTING_REVIEW_TITLE,
        reviewDate: employee.startDate,
        status: 'COMPLETED',
        salaryAmount: salary,
        salaryCurrency: 'USD',
      },
    ];
    let round = 1;
    let date = addMonths(employee.startDate, REVIEW_INTERVAL_MONTHS);
    const titleOf = (n: number): string => (n % 2 === 0 ? 'Annual review' : 'Mid-year review');
    while (date <= end) {
      const raise = new Prisma.Decimal((index + round * 3) % 7).dividedBy(100);
      salary = roundToHundreds(salary.times(raise.plus(1)));
      reviews.push({
        employeeId: employee.id,
        title: titleOf(round),
        reviewDate: date,
        status: 'COMPLETED',
        salaryAmount: salary,
        salaryCurrency: 'USD',
        feedbackHr: doc(FEEDBACK.hr[round % 2]),
        feedbackLead:
          round % 2 === 0 ? listDoc('Strengths', LEAD_POINTS) : doc(FEEDBACK.teamLead[1]),
        feedbackTeam: round % 3 === 2 ? Prisma.DbNull : doc(FEEDBACK.team[round % 2]),
        feedbackClient: index % 2 === 0 ? doc(FEEDBACK.client[round % 2]) : Prisma.DbNull,
      });
      round += 1;
      date = addMonths(employee.startDate, REVIEW_INTERVAL_MONTHS * round);
    }
    // Every eleventh: the last review (within a month) was never held — it is overdue.
    const last = reviews.at(-1);
    if (
      index % 11 === 5 &&
      last &&
      reviews.length > 1 &&
      last.reviewDate instanceof Date &&
      today.getTime() - last.reviewDate.getTime() < 30 * 86_400_000
    ) {
      reviews[reviews.length - 1] = {
        employeeId: employee.id,
        title: last.title,
        reviewDate: last.reviewDate,
        status: 'SCHEDULED',
        salaryAmount: null,
        salaryCurrency: null,
      };
    }
    if (!employee.terminatedOn) {
      reviews.push({
        employeeId: employee.id,
        title: titleOf(round),
        reviewDate: date,
        status: index % 9 === 4 ? 'CANCELED' : 'SCHEDULED',
        salaryAmount: null,
        salaryCurrency: null,
      });
    }
    for (const review of reviews) {
      await prisma.employeeReview.create({
        data: {
          ...review,
          responsibles: {
            create: responsibleUserIds.map((responsibleUserId) => ({ responsibleUserId })),
          },
        },
        select: { id: true },
      });
      created += 1;
    }
  }
  return created;
};
