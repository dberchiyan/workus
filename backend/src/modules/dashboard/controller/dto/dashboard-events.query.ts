import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { pageableOptions } from '../../../../common/dto/pageable';
import { ISO_MONTH_LENGTH } from '../../../../common/time/iso-day';

const HOUR_MS = 3_600_000;
const MAX_DAY_HOURS = 26;

export const EVENTS_PAGEABLE = pageableOptions({
    sortable: ['date'] as const,
    defaultSort: 'date,asc',
});
export type EventsSortField = (typeof EVENTS_PAGEABLE.sortable)[number];

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

export const DateRangeQuerySchema = z
    .object({
        from: z.iso.date('validation.invalid'),
        to: z.iso.date('validation.invalid'),
    })
    .refine(({ from, to }) => from <= to && from.slice(0, ISO_MONTH_LENGTH) === to.slice(0, ISO_MONTH_LENGTH), {
        message: 'validation.invalid',
        path: ['to'],
    });

export class DateRangeQuery extends createZodDto(DateRangeQuerySchema) {}
