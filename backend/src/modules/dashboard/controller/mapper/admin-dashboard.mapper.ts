import type { AdminDashboard } from '../../service/dashboard.types';
import type { AdminDashboardResponse } from '../dto/admin-dashboard.response';

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
