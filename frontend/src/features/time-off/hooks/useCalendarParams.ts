import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { isTimeOffType, TIME_OFF_TYPES, type TimeOffType } from '../types';

export const CALENDAR_PAGE_SIZES = [25, 50, 100] as const;
const DEFAULT_SIZE = 50;
const MONTH = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

export interface CalendarParams {
  /** `YYYY-MM`; absent → the viewer's current month. */
  month: string;
  /** Never empty: at least one type stays on. */
  types: TimeOffType[];
  search: string;
  page: number;
  size: number;
}

const readTypes = (raw: string | null): TimeOffType[] => {
  const types = (raw ?? '').split(',').filter(isTimeOffType);
  // In the fixed order, so the same choice is the same query.
  return types.length > 0
    ? TIME_OFF_TYPES.filter((type) => types.includes(type))
    : [...TIME_OFF_TYPES];
};

const readPage = (raw: string | null): number => {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : 0;
};

const readSize = (raw: string | null): number => {
  const value = Number(raw);
  return (CALENDAR_PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_SIZE;
};

/** Month, types, search and page live in the URL (shareable, back works). */
export const useCalendarParams = (currentMonth: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo<CalendarParams>(() => {
    const month = searchParams.get('month') ?? '';
    return {
      month: MONTH.test(month) ? month : currentMonth,
      types: readTypes(searchParams.get('types')),
      search: searchParams.get('search') ?? '',
      page: readPage(searchParams.get('page')),
      size: readSize(searchParams.get('size')),
    };
  }, [searchParams, currentMonth]);

  /** Anything but the page itself goes back to the first page. */
  const update = useCallback(
    (changes: Partial<CalendarParams>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            const text = Array.isArray(value) ? value.join(',') : String(value);
            const isDefault =
              text === '' ||
              (key === 'month' && text === currentMonth) ||
              (key === 'types' && Array.isArray(value) && value.length === TIME_OFF_TYPES.length);
            if (isDefault) {
              next.delete(key);
            } else {
              next.set(key, text);
            }
          }
          if (!('page' in changes) || next.get('page') === '0') {
            next.delete('page');
          }
          return next;
        },
        // Changing the month is a step back should undo; filters replace.
        { replace: !('month' in changes) },
      );
    },
    [setSearchParams, currentMonth],
  );

  return { params, update };
};
