import { useIsFetching } from '@tanstack/react-query';

/**
 * A query is fetching for the first time (nothing to show yet) — a page is loading its data.
 * Background refreshes (polling, refetch on focus) already have data and don't count.
 */
export const useIsPageLoading = (): boolean =>
  useIsFetching({ predicate: (query) => query.state.status === 'pending' }) > 0;
