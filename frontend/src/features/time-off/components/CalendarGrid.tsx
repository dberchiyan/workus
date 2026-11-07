import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { monthDays } from '../calendar';
import type { CalendarRow } from '../types';
import { CalendarDayHeader } from './CalendarDayHeader';
import { CalendarPersonRow } from './CalendarPersonRow';
import { RequestSearchField } from './RequestSearchField';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5', 's6'];

export interface CalendarGridProps {
  month: string;
  today: string;
  rows: CalendarRow[] | undefined;
  search: string;
  /** Requests open on the Requests page; names open the profile. */
  canOpenRequest: boolean;
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
  search,
  canOpenRequest,
  canOpenProfile,
  onSearch,
}: CalendarGridProps) {
  const { t, i18n } = useTranslation('timeOff');
  const days = monthDays(month);
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', timeZone: 'UTC' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLTableCellElement>(null);
  const loaded = rows !== undefined;

  useEffect(() => {
    const box = scrollRef.current;
    const cell = todayRef.current;
    if (!loaded || !box || !cell || box.scrollWidth <= box.clientWidth) {
      return;
    }
    // Today a few days in from the sticky name column.
    const nameWidth = box.querySelector('thead td')?.getBoundingClientRect().width ?? 0;
    box.scrollLeft = Math.max(0, cell.offsetLeft - nameWidth - cell.offsetWidth * 3);
  }, [month, loaded]);

  return (
    // `isolate`: the sticky name column's z-index stays inside the grid, under the top bar.
    <div ref={scrollRef} className="isolate overflow-x-auto">
      <table
        className="w-full table-fixed border-separate border-spacing-0"
        // One-off geometry: the name column plus 2rem per day before the days start scrolling.
        style={{ minWidth: `calc(11rem + ${String(days.length * 2)}rem)` }}
      >
        <caption className="sr-only">{t('calendar.page.caption')}</caption>
        <colgroup>
          <col className="w-44 sm:w-64" />
          {days.map((date) => (
            <col key={date} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <td className="sticky left-0 z-10 border-b border-divider bg-background-paper px-3 py-3 sm:px-4">
              <RequestSearchField value={search} onSearch={onSearch} />
            </td>
            {days.map((date) => (
              <CalendarDayHeader
                key={date}
                date={date}
                today={date === today}
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
                <td className="sticky left-0 border-b border-divider bg-background-paper px-4 py-2">
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="45%" />
                </td>
                <td colSpan={days.length} className="h-14 border-b border-divider" />
              </tr>
            ))}
          {rows?.length === 0 && (
            <tr>
              <td colSpan={days.length + 1} className="px-4 py-10">
                {/* Pinned to the visible width so it stays in view when the days scroll. */}
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
              canOpenRequest={canOpenRequest}
              canOpenProfile={canOpenProfile}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
