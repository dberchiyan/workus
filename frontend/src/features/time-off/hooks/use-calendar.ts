import type { UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { components } from '@/shared/types/api';

import { calendarApi, type CalendarQuery } from '../api/calendar-api';
import { timeOffKeys } from './query-keys';

/** Another month or filter keeps the previous grid on screen until the new one arrives. */
export const useCalendar = (
    query: CalendarQuery,
): UseQueryResult<{
    content: components['schemas']['TimeOffCalendarRow_Output'][];
    totalElements: number;
    from: string;
    to: string;
    holidays: { heldAt: string; name: string }[];
}> =>
    useQuery({
        queryKey: timeOffKeys.calendar(query),
        queryFn: () => calendarApi.get(query),
        placeholderData: keepPreviousData,
    });
