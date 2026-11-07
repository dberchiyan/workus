import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/** A zero-based page kept in the URL (`?page=`; the first page leaves it out). */
export const useUrlPage = (): [number, (page: number) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = Number(searchParams.get('page'));
  const page = Number.isInteger(raw) && raw >= 0 ? raw : 0;
  const setPage = useCallback(
    (next: number) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next === 0) {
            params.delete('page');
          } else {
            params.set('page', String(next));
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  return [page, setPage];
};
