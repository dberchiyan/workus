import type { Pageable, SortDirection } from '../dto/pageable';

/**
 * Builds skip/take/orderBy from a page request. `orderByFor` maps the whitelisted sort field to
 * Prisma order clauses; `id` is appended as the tie-breaker so pages never overlap.
 */
export const toPrismaPage = <F extends string, O>(
  pageable: Pageable<F>,
  orderByFor: (field: F, direction: SortDirection) => O[],
  tieBreaker: (direction: SortDirection) => O,
): { skip: number; take: number; orderBy: O[] } => ({
  skip: pageable.page * pageable.size,
  take: pageable.size,
  orderBy: [
    ...orderByFor(pageable.sort.field, pageable.sort.direction),
    tieBreaker(pageable.sort.direction),
  ],
});
