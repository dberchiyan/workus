import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { insightsApi } from '../api/insightsApi';
import type { Insights, InsightsFilter } from '../types';

/** No tenant: one company per installation. */
export const insightsKeys = {
  all: ['insights'] as const,
  year: (filter: InsightsFilter) => [...insightsKeys.all, 'year', filter] as const,
  categories: () => [...insightsKeys.all, 'categories'] as const,
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

export const useHeadcount = (filter: InsightsFilter) => useFigure(filter, 'headcount');
export const useTenure = (filter: InsightsFilter) => useFigure(filter, 'tenure');
export const useTurnover = (filter: InsightsFilter) => useFigure(filter, 'turnover');
export const useAbsence = (filter: InsightsFilter) => useFigure(filter, 'absence');
export const useSalary = (filter: InsightsFilter) => useFigure(filter, 'salary');
export const useInsightCategories = () =>
  useQuery({ queryKey: insightsKeys.categories(), queryFn: insightsApi.categories });
