import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { insightsApi } from '../api/insightsApi';
import type { InsightsFilter } from '../types';

/** No tenant: one company per installation. */
export const insightsKeys = {
  all: ['insights'] as const,
  figure: (name: string, filter: InsightsFilter) => [...insightsKeys.all, name, filter] as const,
  categories: () => [...insightsKeys.all, 'categories'] as const,
};

/** Another year or category keeps the previous figures on screen until the new ones arrive. */
const figure = <T>(name: string, filter: InsightsFilter, load: (f: InsightsFilter) => Promise<T>) =>
  ({
    queryKey: insightsKeys.figure(name, filter),
    queryFn: () => load(filter),
    placeholderData: keepPreviousData,
  }) as const;

export const useHeadcount = (filter: InsightsFilter) =>
  useQuery(figure('headcount', filter, insightsApi.headcount));
export const useTenure = (filter: InsightsFilter) =>
  useQuery(figure('tenure', filter, insightsApi.tenure));
export const useTurnover = (filter: InsightsFilter) =>
  useQuery(figure('turnover', filter, insightsApi.turnover));
export const useAbsence = (filter: InsightsFilter) =>
  useQuery(figure('absence', filter, insightsApi.absence));
export const useSalary = (filter: InsightsFilter) =>
  useQuery(figure('salary', filter, insightsApi.salary));
export const useInsightCategories = () =>
  useQuery({ queryKey: insightsKeys.categories(), queryFn: insightsApi.categories });
