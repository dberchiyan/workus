import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import {
  nextSecurityLogPage,
  SECURITY_LOG_PAGE_SIZE,
  type SecurityCategory,
} from '@/features/auth';
import { employeeApi } from '../api/employeeApi';
import { employeeKeys } from './queryKeys';

/** An employee's security log for admins, filtered by category; "Show more" loads the next page. */
export const useEmployeeSecurityLog = (
  employeeId: string,
  category: SecurityCategory | undefined,
) =>
  useInfiniteQuery({
    queryKey: employeeKeys.securityLog(employeeId, category),
    queryFn: ({ pageParam }) =>
      employeeApi.securityLog(employeeId, category, pageParam, SECURITY_LOG_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: nextSecurityLogPage,
    // Another filter keeps the current rows on screen until its own arrive.
    placeholderData: keepPreviousData,
  });
