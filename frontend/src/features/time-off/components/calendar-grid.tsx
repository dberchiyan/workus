import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { type CSSProperties, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { trackScrollEdges } from '@/shared/lib/scroll-edges';

import { monthDays } from '../calendar';
import type { CalendarRow } from '../types';
import { CalendarDayHeader } from './calendar-day-header';
import { CalendarPersonRow } from './calendar-person-row';
import { RequestSearchField } from './request-search-field';

const LEAD_COLUMNS = 3;

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5', 's6'];

export interface CalendarGridProps {
    month: string;
    today: string;
    rows: CalendarRow[] | undefined;
    holidays: ReadonlyMap<string, string>;
    search: string;
    requestHref: ((requestId: string) => string) | undefined;
    canOpenProfile: boolean;
    onSearch: (search: string) => void;
}

/**
 * People down the side, the month's days across. Below ~1250 px the days scroll inside the card
 * (the name column stays put); the current month opens scrolled to today.
 */
export function CalendarGrid({
    month,
    today,
    rows,
    holidays,
    search,
    requestHref,
    canOpenProfile,
    onSearch,
}: CalendarGridProps): ReactElement {
    const { t, i18n } = useTranslation('timeOff');
    const days = monthDays(month);
    const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', timeZone: 'UTC' });
    const scrollRef = useRef<HTMLDivElement>(null);
    const setScrollBox = useCallback((box: HTMLDivElement | null) => {
        scrollRef.current = box;
        return trackScrollEdges(box);
    }, []);
    const todayRef = useRef<HTMLTableCellElement>(null);
    const loaded = rows !== undefined;

    useEffect(() => {
        const box = scrollRef.current;
        const cell = todayRef.current;
        if (!loaded || !box || !cell || box.scrollWidth <= box.clientWidth) {
            return;
        }
        const nameWidth = box.querySelector('thead td')?.getBoundingClientRect().width ?? 0;
        box.scrollLeft = Math.max(0, cell.offsetLeft - nameWidth - cell.offsetWidth * LEAD_COLUMNS);
    }, [month, loaded]);

    return (
        <div ref={setScrollBox} className="app-scroll-fade-end relative isolate overflow-x-auto">
            <table
                className="w-full min-w-[calc(10rem+var(--days)*2.5rem)] table-fixed border-separate border-spacing-0 sm:min-w-[calc(11rem+var(--days)*2rem)]"
                style={{ '--days': days.length } as CSSProperties}
            >
                <caption className="sr-only">{t('calendar.page.caption')}</caption>
                <colgroup>
                    <col className="w-40 sm:w-64" />
                    {days.map((date) => (
                        <col key={date} />
                    ))}
                </colgroup>
                <thead>
                    <tr>
                        <td className="app-scroll-shadow sticky left-0 z-10 border-b border-divider bg-background-paper px-3 py-3 sm:px-4">
                            <RequestSearchField value={search} onSearch={onSearch} />
                        </td>
                        {days.map((date) => (
                            <CalendarDayHeader
                                key={date}
                                date={date}
                                today={date === today}
                                holiday={holidays.get(date)}
                                weekday={weekday.format(new Date(`${date}T00:00:00Z`))}
                                {...(date === today ? { ref: todayRef } : {})}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {!rows &&
                        SKELETON_ROWS.map((key) => (
                            <tr key={key}>
                                <td className="app-scroll-shadow sticky left-0 z-10 border-b border-divider bg-background-paper px-4 py-2">
                                    <Skeleton variant="text" width="70%" />
                                    <Skeleton variant="text" width="45%" />
                                </td>
                                <td colSpan={days.length} className="h-14 border-b border-divider" />
                            </tr>
                        ))}
                    {rows?.length === 0 && (
                        <tr>
                            <td colSpan={days.length + 1} className="px-4 py-10">
                                <Typography variant="body2" color="textSecondary" className="sticky left-4">
                                    {search ? t('calendar.page.noMatches') : t('calendar.page.empty')}
                                </Typography>
                            </td>
                        </tr>
                    )}
                    {rows?.map((row) => (
                        <CalendarPersonRow
                            key={row.employee.id}
                            row={row}
                            days={days}
                            today={today}
                            holidays={holidays}
                            requestHref={requestHref}
                            canOpenProfile={canOpenProfile}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
