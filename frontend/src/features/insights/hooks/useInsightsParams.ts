import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { InsightsFilter } from '../types';

export const FIRST_YEAR = 2000;

/** Year and category live in the URL (shareable, back works); the year defaults to this one. */
export const useInsightsParams = (currentYear: number) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = useMemo<InsightsFilter>(() => {
    const year = Number(searchParams.get('year'));
    return {
      year:
        Number.isInteger(year) && year >= FIRST_YEAR && year <= currentYear ? year : currentYear,
      categoryId: searchParams.get('category') ?? undefined,
    };
  }, [searchParams, currentYear]);

  const update = useCallback(
    (changes: Partial<InsightsFilter>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (changes.year !== undefined) {
            if (changes.year === currentYear) {
              next.delete('year');
            } else {
              next.set('year', String(changes.year));
            }
          }
          if ('categoryId' in changes) {
            if (changes.categoryId) {
              next.set('category', changes.categoryId);
            } else {
              next.delete('category');
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, currentYear],
  );

  return { filter, update };
};
