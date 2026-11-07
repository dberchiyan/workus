import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { calendarApi, type CalendarQuery } from '../api/calendarApi';
import { timeOffKeys } from './queryKeys';

/** Another month or filter keeps the previous grid on screen until the new one arrives. */
export const useCalendar = (query: CalendarQuery) =>
  useQuery({
    queryKey: timeOffKeys.calendar(query),
    queryFn: () => calendarApi.get(query),
    placeholderData: keepPreviousData,
  });
