import { apiClient } from '@/shared/api/client';
import { TIME_OFF_TYPES, type TimeOffCalendar, type TimeOffType } from '../types';

export interface CalendarQuery {
  /** `YYYY-MM`. */
  month: string;
  types: readonly TimeOffType[];
  search: string;
  page: number;
  size: number;
}

/** The company calendar: everyone's approved and pending time off in one month. */
export const calendarApi = {
  get: async (query: CalendarQuery): Promise<TimeOffCalendar> =>
    (
      await apiClient.get<TimeOffCalendar>('/api/v1/time-off/calendar', {
        params: {
          month: query.month,
          page: query.page,
          size: query.size,
          // All types is the server's default; send only a narrower choice.
          ...(query.types.length < TIME_OFF_TYPES.length ? { types: query.types.join(',') } : {}),
          ...(query.search ? { search: query.search } : {}),
        },
      })
    ).data,
};
