import type { UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { components } from '@/shared/types/api';

import { insightsApi } from '../api/insights-api';
import type { Insights, InsightsFilter } from '../types';

export const insightsKeys = {
    all: ['insights'] as const,
    year: (filter: InsightsFilter): readonly ['insights', 'year', InsightsFilter] =>
        [...insightsKeys.all, 'year', filter] as const,
    categories: (): readonly ['insights', 'categories'] => [...insightsKeys.all, 'categories'] as const,
};

/**
 * One figure of the year. Every section shares one request (same key, one cache entry) and
 * selects its part; another year or category keeps the old figures until the new ones arrive.
 */
const useFigure = <K extends keyof Insights>(filter: InsightsFilter, figure: K) =>
    useQuery({
        queryKey: insightsKeys.year(filter),
        queryFn: () => insightsApi.get(filter),
        placeholderData: keepPreviousData,
        select: (insights: Insights): Insights[K] => insights[figure],
    });

export const useHeadcount = (
    filter: InsightsFilter,
): UseQueryResult<{
    groups: components['schemas']['InsightGroup_Output'][];
    months: { month: number; counts: number[] | null }[];
    current: number;
    previous: number;
}> => useFigure(filter, 'headcount');
export const useTenure = (
    filter: InsightsFilter,
): UseQueryResult<{
    averageMonths: number | null;
    previousAverageMonths: number | null;
    groups: {
        id: string;
        name: string;
        averageMonths: number;
        employees: number;
        items: { id: string; name: string; averageMonths: number; employees: number }[];
    }[];
}> => useFigure(filter, 'tenure');
export const useTurnover = (
    filter: InsightsFilter,
): UseQueryResult<{
    months: {
        month: number;
        hired: {
            employeeId: string;
            userId: string;
            firstName: string;
            lastName: string;
            positionTitle: string;
            movedAt: string;
        }[];
        left: {
            employeeId: string;
            userId: string;
            firstName: string;
            lastName: string;
            positionTitle: string;
            movedAt: string;
        }[];
    }[];
    hiredTotal: number;
    leftTotal: number;
    rate: number | null;
    previousRate: number | null;
}> => useFigure(filter, 'turnover');
export const useAbsence = (
    filter: InsightsFilter,
): UseQueryResult<{
    top: {
        person: components['schemas']['InsightPerson_Output'];
        days: number;
        byType: { VACATION: number; SICK_DAY: number; DAY_OFF: number };
    }[];
    averageDays: number | null;
    previousAverageDays: number | null;
}> => useFigure(filter, 'absence');
export const useSalary = (
    filter: InsightsFilter,
): UseQueryResult<{
    average: components['schemas']['Money_Output'] | null;
    previousAverage: components['schemas']['Money_Output'] | null;
    groups: { id: string; name: string; average: components['schemas']['Money_Output']; employees: number }[];
}> => useFigure(filter, 'salary');
export const useInsightCategories = (
    enabled = true,
): UseQueryResult<{ total: number; categories: { id: string; name: string; employeeCount: number }[] }> =>
    useQuery({ queryKey: insightsKeys.categories(), queryFn: insightsApi.categories, enabled });
