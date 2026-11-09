import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SECURITY_LOG_PAGE_SIZE, type SecurityCategory } from '@/features/auth';
import { employeeApi } from '../api/employeeApi';
import { employeeKeys } from './queryKeys';

/** An employee's security log for admins, filtered by category, one page at a time. */
export const useEmployeeSecurityLog = (
  employeeId: string,
  category: SecurityCategory | undefined,
  page: number,
) =>
  useQuery({
    queryKey: employeeKeys.securityLog(employeeId, category, page),
    queryFn: () => employeeApi.securityLog(employeeId, category, page, SECURITY_LOG_PAGE_SIZE),
    // Another page or filter keeps the current rows on screen until its own arrive.
    placeholderData: keepPreviousData,
  });
