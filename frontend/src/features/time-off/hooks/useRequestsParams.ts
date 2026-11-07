import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CLOSED_STATUSES, type ClosedStatus, isTimeOffType, type TimeOffType } from '../types';

export const CLOSED_PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_CLOSED_SIZE = 10;

export interface RequestsParams {
  type: TimeOffType | undefined;
  /** Only requests the viewer may decide. */
  mine: boolean;
  search: string;
  status: ClosedStatus | undefined;
  page: number;
  size: number;
  /** The request open in the dialog. */
  request: string | undefined;
}

const isClosedStatus = (value: string): value is ClosedStatus =>
  (CLOSED_STATUSES as readonly string[]).includes(value);

const readPage = (raw: string | null): number => {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : 0;
};

const readSize = (raw: string | null): number => {
  const value = Number(raw);
  return (CLOSED_PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_CLOSED_SIZE;
};

/** Filters, the closed list's page and the open request live in the URL (shareable, back works). */
export const useRequestsParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo<RequestsParams>(() => {
    const type = searchParams.get('type') ?? '';
    const status = searchParams.get('status') ?? '';
    return {
      type: isTimeOffType(type) ? type : undefined,
      mine: searchParams.get('mine') === 'true',
      search: searchParams.get('search') ?? '',
      status: isClosedStatus(status) ? status : undefined,
      page: readPage(searchParams.get('page')),
      size: readSize(searchParams.get('size')),
      request: searchParams.get('request') ?? undefined,
    };
  }, [searchParams]);

  /** Any filter change goes back to the first page of the closed list. */
  const update = useCallback(
    (changes: Partial<RequestsParams>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          const filterChanged = Object.keys(changes).some(
            (key) => key !== 'page' && key !== 'size' && key !== 'request',
          );
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === '' || value === false) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          if (filterChanged || changes.size !== undefined) {
            next.delete('page');
          }
          if (next.get('page') === '0') {
            next.delete('page');
          }
          return next;
        },
        // Opening / closing a request is a step back-navigation should undo; filters replace.
        { replace: !('request' in changes) },
      );
    },
    [setSearchParams],
  );

  return { params, update };
};
