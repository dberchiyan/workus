import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { employeeApi } from '../api/employeeApi';
import { employeeKeys } from './queryKeys';

export const ACTIVITY_PAGE_SIZE = 10;

/**
 * The change history, newest first, one numbered page at a time. Another page keeps the current
 * one on screen until it arrives. staleTime 0: the tab mounts only when opened, so it always
 * shows changes made a moment ago in the Review tab without coupling the review feature to this key.
 */
export const useEmployeeActivity = (employeeId: string, page: number) =>
  useQuery({
    queryKey: employeeKeys.activityPage(employeeId, page),
    queryFn: () => employeeApi.activity(employeeId, page, ACTIVITY_PAGE_SIZE),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
