import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SECURITY_LOG_PAGE_SIZE } from '@/features/auth';
import { employeeApi } from '../api/employeeApi';
import { employeeKeys } from './queryKeys';

/** An employee's security log for admins, a page at a time. */
export const useEmployeeSecurityLog = (employeeId: string, page: number) =>
  useQuery({
    queryKey: employeeKeys.securityLog(employeeId, page),
    queryFn: () => employeeApi.securityLog(employeeId, page, SECURITY_LOG_PAGE_SIZE),
    placeholderData: keepPreviousData,
  });
