import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { pageableOptions } from '../../../../common/dto/pageable';

const HOUR_MS = 3_600_000;
/** A day is 24 hours in UTC; a little slack, never more. */
const MAX_DAY_HOURS = 26;

/** Event lists: by date, then name — the order is fixed, only page and size apply. */
export const EVENTS_PAGEABLE = pageableOptions({
  sortable: ['date'] as const,
  defaultSort: 'date,asc',
});
export type EventsSortField = (typeof EVENTS_PAGEABLE.sortable)[number];

/** The instants a day (today, UTC — days are UTC everywhere) starts and ends. */
export const InstantRangeQuerySchema = z
  .object({
    from: z.iso.datetime({ offset: true, error: 'validation.invalid' }),
    to: z.iso.datetime({ offset: true, error: 'validation.invalid' }),
  })
  .refine(
    ({ from, to }) => {
      const span = Date.parse(to) - Date.parse(from);
      return span > 0 && span <= MAX_DAY_HOURS * HOUR_MS;
    },
    { message: 'validation.invalid', path: ['to'] },
  );

export class InstantRangeQuery extends createZodDto(InstantRangeQuerySchema) {}

/** Calendar dates `from` ≤ `to`, both in one month (a day, or the whole month). */
export const DateRangeQuerySchema = z
  .object({
    from: z.iso.date('validation.invalid'),
    to: z.iso.date('validation.invalid'),
  })
  .refine(({ from, to }) => from <= to && from.slice(0, 7) === to.slice(0, 7), {
    message: 'validation.invalid',
    path: ['to'],
  });

export class DateRangeQuery extends createZodDto(DateRangeQuerySchema) {}
