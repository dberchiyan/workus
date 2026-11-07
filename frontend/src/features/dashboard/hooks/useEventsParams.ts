import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export type EventsTab = 'today' | 'month';
const MONTH = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

export interface EventsParams {
  tab: EventsTab;
  /** `YYYY-MM` of each month card; absent → the current month (UTC). */
  reviewsMonth: string;
  birthdaysMonth: string;
  /** Zero-based page of each card in the open tab. */
  reviewsPage: number;
  birthdaysPage: number;
}

const readPage = (raw: string | null): number => {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : 0;
};

/** The events tab and each card's month live in the URL (shareable, back works). */
export const useEventsParams = (currentMonth: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo<EventsParams>(() => {
    const month = (key: string) => {
      const value = searchParams.get(key) ?? '';
      return MONTH.test(value) ? value : currentMonth;
    };
    return {
      tab: searchParams.get('events') === 'month' ? 'month' : 'today',
      reviewsMonth: month('reviewsMonth'),
      birthdaysMonth: month('birthdaysMonth'),
      reviewsPage: readPage(searchParams.get('reviewsPage')),
      birthdaysPage: readPage(searchParams.get('birthdaysPage')),
    };
  }, [searchParams, currentMonth]);

  const update = useCallback(
    (changes: Partial<EventsParams>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          const set = (key: string, value: string | undefined, fallback: string) => {
            if (value === undefined) {
              return;
            }
            if (value === fallback) {
              next.delete(key);
            } else {
              next.set(key, value);
            }
          };
          set('events', changes.tab, 'today');
          set('reviewsMonth', changes.reviewsMonth, currentMonth);
          set('birthdaysMonth', changes.birthdaysMonth, currentMonth);
          set('reviewsPage', changes.reviewsPage?.toString(), '0');
          set('birthdaysPage', changes.birthdaysPage?.toString(), '0');
          // Another tab starts both cards from their first page; another month, its card.
          if (changes.tab !== undefined) {
            next.delete('reviewsPage');
            next.delete('birthdaysPage');
          }
          if (changes.reviewsMonth !== undefined) {
            next.delete('reviewsPage');
          }
          if (changes.birthdaysMonth !== undefined) {
            next.delete('birthdaysPage');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, currentMonth],
  );

  return { params, update };
};
