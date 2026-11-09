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
  requestsPage: number;
  reviewsPage: number;
  birthdaysPage: number;
  /** The request open in the dialog over the dashboard. */
  request: string | undefined;
}

const readPage = (raw: string | null): number => {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : 0;
};

/** The events tab, each card's month and page, and the open request live in the URL (shareable, back works). */
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
      requestsPage: readPage(searchParams.get('requestsPage')),
      reviewsPage: readPage(searchParams.get('reviewsPage')),
      birthdaysPage: readPage(searchParams.get('birthdaysPage')),
      request: searchParams.get('request') ?? undefined,
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
          set('requestsPage', changes.requestsPage?.toString(), '0');
          set('reviewsPage', changes.reviewsPage?.toString(), '0');
          set('birthdaysPage', changes.birthdaysPage?.toString(), '0');
          // Another tab starts both cards from their first page; another month, its card.
          if (changes.tab !== undefined) {
            next.delete('requestsPage');
            next.delete('reviewsPage');
            next.delete('birthdaysPage');
          }
          if (changes.reviewsMonth !== undefined) {
            next.delete('reviewsPage');
          }
          if (changes.birthdaysMonth !== undefined) {
            next.delete('birthdaysPage');
          }
          if ('request' in changes && !changes.request) {
            next.delete('request');
          }
          return next;
        },
        // Closing a request is a step back should undo; the rest replaces.
        { replace: !('request' in changes) },
      );
    },
    [setSearchParams, currentMonth],
  );

  /** The link that opens a request over the dashboard as it is now (opening is a history step). */
  const requestHref = useCallback(
    (requestId: string): string => {
      const next = new URLSearchParams(searchParams);
      next.set('request', requestId);
      return `?${next.toString()}`;
    },
    [searchParams],
  );

  return { params, update, requestHref };
};
