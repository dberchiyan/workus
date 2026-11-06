import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import type { EmployeeListParams } from '../types';

export const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_SIZE = 20;
const DEFAULT_SORT = 'name,asc';

/** URL is the source of truth; anything malformed falls back to the default. */
const urlSchema = z.object({
  category: z.uuid().optional().catch(undefined),
  status: z.enum(['active', 'terminated']).catch('active'),
  q: z.string().max(100).catch(''),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  size: z.coerce
    .number()
    .refine((size) => (PAGE_SIZES as readonly number[]).includes(size))
    .catch(DEFAULT_SIZE),
  sort: z.enum(['name,asc', 'name,desc', 'startDate,asc', 'startDate,desc']).catch('name,asc'),
});

const SORTS = {
  'name,asc': { sortField: 'name', sortDirection: 'asc' },
  'name,desc': { sortField: 'name', sortDirection: 'desc' },
  'startDate,asc': { sortField: 'startDate', sortDirection: 'asc' },
  'startDate,desc': { sortField: 'startDate', sortDirection: 'desc' },
} as const satisfies Record<string, Pick<EmployeeListParams, 'sortField' | 'sortDirection'>>;

type ListChange = Partial<Omit<EmployeeListParams, 'page'>> & { page?: number };

const parseParams = (searchParams: URLSearchParams): EmployeeListParams => {
  const url = urlSchema.parse({
    category: searchParams.get('category') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    size: searchParams.get('size') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
  });
  return {
    categoryId: url.category,
    status: url.status === 'terminated' ? 'TERMINATED' : 'ACTIVE',
    search: url.q,
    page: url.page,
    size: url.size,
    ...SORTS[url.sort],
  };
};

const toSearchParams = (params: EmployeeListParams): URLSearchParams => {
  const sort = `${params.sortField},${params.sortDirection}`;
  const entries: [string, string | undefined][] = [
    ['category', params.categoryId],
    ['status', params.status === 'TERMINATED' ? 'terminated' : undefined],
    ['q', params.search || undefined],
    ['page', params.page > 1 ? String(params.page) : undefined],
    ['size', params.size === DEFAULT_SIZE ? undefined : String(params.size)],
    ['sort', sort === DEFAULT_SORT ? undefined : sort],
  ];
  return new URLSearchParams(
    entries.filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
};

/** Tab, filters, page and sort live in the URL (data.md → Client state). */
export const useEmployeeListParams = (): {
  params: EmployeeListParams;
  update: (change: ListChange) => void;
} => {
  const [searchParams, setSearchParams] = useSearchParams();

  const update = useCallback(
    (change: ListChange): void => {
      setSearchParams(
        // Any change other than the page itself starts again from page 1.
        (current) => toSearchParams({ ...parseParams(current), page: 1, ...change }),
        // Typing a search replaces the history entry instead of adding one per pause.
        { replace: change.search !== undefined },
      );
    },
    [setSearchParams],
  );

  return { params: parseParams(searchParams), update };
};
