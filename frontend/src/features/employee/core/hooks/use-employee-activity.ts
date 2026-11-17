import type { UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { components } from '@/shared/types/api';

import { employeeApi } from '../api/employee-api';
import { employeeKeys } from './query-keys';

export const ACTIVITY_PAGE_SIZE = 10;

/**
 * The change history, newest first, one numbered page at a time. Another page keeps the current
 * one on screen until it arrives. staleTime 0: the tab mounts only when opened, so it always
 * shows changes made a moment ago in the Review tab without coupling the review feature to this key.
 */
export const useEmployeeActivity = (
    employeeId: string,
    page: number,
): UseQueryResult<{
    content: {
        id: string;
        occurredAt: string;
        action:
            | 'employee.created'
            | 'employee.updated'
            | 'employee.terminated'
            | 'employee.termination_canceled'
            | 'review.created'
            | 'review.updated'
            | 'review.deleted'
            | 'time_off_request.created'
            | 'time_off_request.approved'
            | 'time_off_request.rejected'
            | 'time_off_request.canceled'
            | 'time_off_request.updated';
        actor: { id: string; firstName: string; lastName: string } | null;
        target: {
            type:
                | 'employee'
                | 'review'
                | 'time_off_request'
                | 'holiday'
                | 'user'
                | 'organisation'
                | 'department'
                | 'position';
            id: string;
            label: string;
        };
        changes: {
            field:
                | 'title'
                | 'reviewedAt'
                | 'heldAt'
                | 'status'
                | 'salary'
                | 'responsibles'
                | 'feedbackHr'
                | 'feedbackTeamLead'
                | 'feedbackTeam'
                | 'feedbackClient'
                | 'position'
                | 'startsAt'
                | 'firstName'
                | 'lastName'
                | 'email'
                | 'mobile'
                | 'personalEmail'
                | 'linkedinUrl'
                | 'telegram'
                | 'address'
                | 'bornAt'
                | 'terminatedAt'
                | 'terminationReason'
                | 'terminationComment'
                | 'timeOffType'
                | 'periodStartsAt'
                | 'periodEndsAt'
                | 'days'
                | 'note'
                | 'decisionComment'
                | 'name'
                | 'isRecurring'
                | 'role'
                | 'plan';
            from:
                | (
                      | { kind: 'text'; text: string }
                      | { kind: 'date'; at: string }
                      | { kind: 'money'; money: components['schemas']['Money_Output'] }
                      | { kind: 'reviewStatus'; status: string }
                      | { kind: 'people'; people: { id: string; firstName: string; lastName: string }[] }
                      | { kind: 'feedback' }
                      | { kind: 'terminationReason'; reason: string }
                      | { kind: 'redacted' }
                      | { kind: 'timeOffType'; type: string }
                      | { kind: 'timeOffStatus'; status: string }
                      | { kind: 'number'; number: number }
                      | { kind: 'flag'; flag: boolean }
                  )
                | null;
            to:
                | (
                      | { kind: 'text'; text: string }
                      | { kind: 'date'; at: string }
                      | { kind: 'money'; money: components['schemas']['Money_Output'] }
                      | { kind: 'reviewStatus'; status: string }
                      | { kind: 'people'; people: { id: string; firstName: string; lastName: string }[] }
                      | { kind: 'feedback' }
                      | { kind: 'terminationReason'; reason: string }
                      | { kind: 'redacted' }
                      | { kind: 'timeOffType'; type: string }
                      | { kind: 'timeOffStatus'; status: string }
                      | { kind: 'number'; number: number }
                      | { kind: 'flag'; flag: boolean }
                  )
                | null;
        }[];
    }[];
    totalElements: number;
}> =>
    useQuery({
        queryKey: employeeKeys.activityPage(employeeId, page),
        queryFn: () => employeeApi.activity(employeeId, page, ACTIVITY_PAGE_SIZE),
        placeholderData: keepPreviousData,
        staleTime: 0,
    });
