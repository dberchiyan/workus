import type { SecurityCategory } from '@/features/auth';

import type { EmployeeFilters, EmployeeListParams } from '../types';

export const employeeKeys = {
    all: ['employees'] as const,
    lists: (): readonly ['employees', 'list'] => [...employeeKeys.all, 'list'] as const,
    list: (params: EmployeeListParams): readonly ['employees', 'list', EmployeeListParams] =>
        [...employeeKeys.lists(), params] as const,
    summary: (): readonly ['employees', 'summary'] => [...employeeKeys.all, 'summary'] as const,
    detail: (employeeId: string): readonly ['employees', 'detail', string] =>
        [...employeeKeys.all, 'detail', employeeId] as const,
    activity: (employeeId: string): readonly ['employees', 'detail', string, 'activity'] =>
        [...employeeKeys.detail(employeeId), 'activity'] as const,
    activityPage: (employeeId: string, page: number): readonly ['employees', 'detail', string, 'activity', number] =>
        [...employeeKeys.activity(employeeId), page] as const,
    securityLog: (
        employeeId: string,
        category: SecurityCategory | undefined,
        page: number,
    ): readonly ['employees', 'detail', string, 'security-log', SecurityCategory | 'ALL', number] =>
        [...employeeKeys.detail(employeeId), 'security-log', category ?? 'ALL', page] as const,
    categories: (filters: EmployeeFilters): readonly ['employees', 'categories', EmployeeFilters] =>
        [...employeeKeys.all, 'categories', filters] as const,
    positions: (): readonly ['employees', 'positions'] => [...employeeKeys.all, 'positions'] as const,
    structure: (): readonly ['employees', 'structure'] => [...employeeKeys.all, 'structure'] as const,
    positionHolders: (
        positionId: string,
        page: number,
    ): readonly ['employees', 'structure', 'holders', string, number] =>
        [...employeeKeys.structure(), 'holders', positionId, page] as const,
    responsibleCandidates: (search: string): readonly ['employees', 'responsible-candidates', string] =>
        [...employeeKeys.all, 'responsible-candidates', search] as const,
};
