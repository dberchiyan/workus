import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { isTimeOffType, TIME_OFF_TYPES, type TimeOffType } from '../types';

const SMALL_PAGE = 25;
const MEDIUM_PAGE = 50;
const LARGE_PAGE = 100;

export const CALENDAR_PAGE_SIZES = [SMALL_PAGE, MEDIUM_PAGE, LARGE_PAGE] as const;
const DEFAULT_SIZE = 50;
const MONTH = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

export interface CalendarParams {
    month: string;
    types: TimeOffType[];
    search: string;
    page: number;
    size: number;
    request: string | undefined;
}

const readTypes = (raw: string | null): TimeOffType[] => {
    const types = (raw ?? '').split(',').filter(isTimeOffType);
    return types.length > 0 ? TIME_OFF_TYPES.filter((type) => types.includes(type)) : [...TIME_OFF_TYPES];
};

const readPage = (raw: string | null): number => {
    const value = Number(raw);
    return Number.isInteger(value) && value >= 0 ? value : 0;
};

const readSize = (raw: string | null): number => {
    const value = Number(raw);
    return (CALENDAR_PAGE_SIZES as readonly number[]).includes(value) ? value : DEFAULT_SIZE;
};

/** Month, types, search, page and the open request live in the URL (shareable, back works). */
export const useCalendarParams = (
    currentMonth: string,
): {
    params: CalendarParams;
    update: (changes: Partial<CalendarParams>) => void;
    requestHref: (requestId: string) => string;
} => {
    const [searchParams, setSearchParams] = useSearchParams();
    const params = useMemo<CalendarParams>(() => {
        const month = searchParams.get('month') ?? '';
        return {
            month: MONTH.test(month) ? month : currentMonth,
            types: readTypes(searchParams.get('types')),
            search: searchParams.get('search') ?? '',
            page: readPage(searchParams.get('page')),
            size: readSize(searchParams.get('size')),
            request: searchParams.get('request') ?? undefined,
        };
    }, [searchParams, currentMonth]);

    const update = useCallback(
        (changes: Partial<CalendarParams>) => {
            setSearchParams(
                (current) => {
                    const next = new URLSearchParams(current);
                    for (const [key, value] of Object.entries(changes)) {
                        const text = Array.isArray(value) ? value.join(',') : String(value ?? '');
                        const isDefault =
                            text === '' ||
                            (key === 'month' && text === currentMonth) ||
                            (key === 'types' && Array.isArray(value) && value.length === TIME_OFF_TYPES.length);
                        if (isDefault) {
                            next.delete(key);
                        } else {
                            next.set(key, text);
                        }
                    }
                    if (!('page' in changes || 'request' in changes) || next.get('page') === '0') {
                        next.delete('page');
                    }
                    return next;
                },
                { replace: !('month' in changes || 'request' in changes) },
            );
        },
        [setSearchParams, currentMonth],
    );

    const requestHref = useCallback(
        (requestId: string): string => {
            const next = new URLSearchParams(searchParams);
            next.set('request', requestId);
            return `?${next.toString()}`;
        },
        [searchParams],
    );

    return { params, update, requestHref };
};
