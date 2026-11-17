import type { UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { SECURITY_LOG_PAGE_SIZE, type SecurityCategory } from '@/features/auth';
import type { components } from '@/shared/types/api';

import { employeeApi } from '../api/employee-api';
import { employeeKeys } from './query-keys';

/** An employee's security log for admins, filtered by category, one page at a time. */
export const useEmployeeSecurityLog = (
    employeeId: string,
    category: SecurityCategory | undefined,
    page: number,
): UseQueryResult<{ content: components['schemas']['SecurityEvent_Output'][]; totalElements: number }> =>
    useQuery({
        queryKey: employeeKeys.securityLog(employeeId, category, page),
        queryFn: () => employeeApi.securityLog(employeeId, category, page, SECURITY_LOG_PAGE_SIZE),
        // Another page or filter keeps the current rows on screen until its own arrive.
        placeholderData: keepPreviousData,
    });
