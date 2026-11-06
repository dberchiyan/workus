import { useInfiniteQuery } from '@tanstack/react-query';
import { employeeApi } from '../api/employeeApi';
import { employeeKeys } from './queryKeys';

export const ACTIVITY_PAGE_SIZE = 20;

/**
 * The change history, newest first, one page at a time ("Show older changes").
 * staleTime 0: the tab mounts only when opened, so it always shows changes made a moment ago
 * in the Review tab without coupling the review feature to this key.
 */
export const useEmployeeActivity = (employeeId: string) =>
  useInfiniteQuery({
    queryKey: employeeKeys.activity(employeeId),
    queryFn: ({ pageParam }) => employeeApi.activity(employeeId, pageParam, ACTIVITY_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      pages.reduce((sum, page) => sum + page.content.length, 0) < last.totalElements
        ? pages.length
        : undefined,
    staleTime: 0,
  });
