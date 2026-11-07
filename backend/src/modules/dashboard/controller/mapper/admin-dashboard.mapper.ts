import type {
  EmployeeBirthday,
  EmployeeBirthdays,
} from '../../../employee/core/service/employee.types';
import type {
  DashboardReview,
  DashboardReviews,
} from '../../../employee/review/service/review.types';
import type { DashboardRequest, DashboardRequests } from '../../../time-off/service/time-off.types';
import type { AdminDashboard } from '../../service/dashboard.types';
import type {
  AdminDashboardResponse,
  DashboardBirthdaysResponse,
  DashboardRequestsResponse,
  DashboardReviewsResponse,
} from '../dto/admin-dashboard.response';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const toAdminDashboardResponse = ({
  today,
  timeOff,
  reviews,
  movements,
}: AdminDashboard): AdminDashboardResponse => ({
  today: isoDate(today),
  pendingRequests: {
    count: timeOff.pendingCount,
    oldestCreatedAt: timeOff.oldestPendingCreatedAt?.toISOString() ?? null,
  },
  outToday: {
    count: timeOff.outTodayCount,
    people: timeOff.outToday.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
    })),
    laterThisWeek: timeOff.outLaterThisWeekCount,
  },
  reviewsDue: { upcoming: reviews.upcoming, overdue: reviews.overdue },
  movements: {
    joining: movements.joining,
    leaving: movements.leaving,
    next: movements.next
      ? {
          kind: movements.next.kind,
          date: isoDate(movements.next.date),
          employeeId: movements.next.employeeId,
          person: {
            id: movements.next.userId,
            firstName: movements.next.firstName,
            lastName: movements.next.lastName,
          },
        }
      : null,
  },
});

const toRequest = (request: DashboardRequest): DashboardRequestsResponse['content'][number] => ({
  id: request.id,
  type: request.type,
  status: request.status,
  startDate: isoDate(request.startDate),
  endDate: isoDate(request.endDate),
  days: request.days,
  createdAt: request.createdAt.toISOString(),
  employee: request.employee,
});

const toReview = (review: DashboardReview): DashboardReviewsResponse['content'][number] => ({
  id: review.id,
  title: review.title,
  reviewDate: isoDate(review.reviewDate),
  // Only scheduled and completed reviews are listed.
  status: review.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
  employee: review.employee,
});

const toBirthday = (birthday: EmployeeBirthday): DashboardBirthdaysResponse['content'][number] => ({
  month: birthday.month,
  day: birthday.day,
  employee: {
    id: birthday.employeeId,
    userId: birthday.userId,
    firstName: birthday.firstName,
    lastName: birthday.lastName,
    positionTitle: birthday.positionTitle,
  },
});

export const toDashboardReviewsResponse = (
  reviews: DashboardReviews,
): DashboardReviewsResponse => ({
  content: reviews.content.map(toReview),
  totalElements: reviews.totalElements,
});

export const toDashboardBirthdaysResponse = (
  birthdays: EmployeeBirthdays,
): DashboardBirthdaysResponse => ({
  content: birthdays.content.map(toBirthday),
  totalElements: birthdays.totalElements,
});

export const toDashboardRequestsResponse = (
  requests: DashboardRequests,
): DashboardRequestsResponse => ({
  content: requests.content.map(toRequest),
  totalElements: requests.totalElements,
});
