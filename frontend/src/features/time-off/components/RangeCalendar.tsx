import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { addDaysIso, addMonthsIso, isWeekendIso, monthGrid, todayIsoLocal } from '../calendar';

export interface DateRange {
  start: string;
  end: string;
}

export interface RangeCalendarProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

/**
 * A month grid (WAI-ARIA grid pattern) for a date range: the first click picks the first day,
 * the next one on or after it picks the last; a single day is a valid range. Arrow keys move by
 * day / week, Home / End to the week's ends, PageUp / PageDown by month; Enter or Space picks.
 */
export function RangeCalendar({ value, onChange }: RangeCalendarProps) {
  const { t, i18n } = useTranslation('timeOff');
  const locale = i18n.language;
  const titleId = useId();
  const [month, setMonth] = useState(() => value.start.slice(0, 7));
  const [focused, setFocused] = useState(value.start);
  // After a first click the next one picks the last day.
  const [isPickingEnd, setIsPickingEnd] = useState(false);
  // Keyboard moves focus with the active day (also across months); clicks do not.
  const shouldMoveFocus = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);
  const today = todayIsoLocal();

  useEffect(() => {
    if (shouldMoveFocus.current) {
      shouldMoveFocus.current = false;
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
    }
  }, [focused, month]);

  const { weeks, weekdays } = monthGrid(month, locale);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));
  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' });

  const pick = (date: string): void => {
    if (isPickingEnd && date >= value.start) {
      onChange({ start: value.start, end: date });
      setIsPickingEnd(false);
    } else {
      onChange({ start: date, end: date });
      setIsPickingEnd(true);
    }
    setFocused(date);
  };

  const moveTo = (date: string): void => {
    setFocused(date);
    setMonth(date.slice(0, 7));
    shouldMoveFocus.current = true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: string): void => {
    const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() - weekdays.firstDay + 7) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDaysIso(date, -1),
      ArrowRight: () => addDaysIso(date, 1),
      ArrowUp: () => addDaysIso(date, -7),
      ArrowDown: () => addDaysIso(date, 7),
      Home: () => addDaysIso(date, -weekday),
      End: () => addDaysIso(date, 6 - weekday),
      PageUp: () => addMonthsIso(date, -1),
      PageDown: () => addMonthsIso(date, 1),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      moveTo(move());
    }
  };

  const showMonth = (months: number): void => {
    const next = addMonthsIso(`${month}-01`, months).slice(0, 7);
    setMonth(next);
    setFocused(`${next}-01`);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <IconButton
          aria-label={t('calendar.previous')}
          onClick={() => {
            showMonth(-1);
          }}
        >
          <ChevronLeftOutlined aria-hidden />
        </IconButton>
        <Typography id={titleId} variant="subtitle1" component="h4" aria-live="polite">
          {monthLabel}
        </Typography>
        <IconButton
          aria-label={t('calendar.next')}
          onClick={() => {
            showMonth(1);
          }}
        >
          <ChevronRightOutlined aria-hidden />
        </IconButton>
      </div>
      {/* WAI-ARIA APG date grid: a table with role="grid" and roving focus on day buttons. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role */}
      <table ref={gridRef} role="grid" aria-labelledby={titleId} className="w-full border-collapse">
        <thead>
          <tr>
            {weekdays.labels.map((label) => (
              <th key={label.long} scope="col" abbr={label.long} className="p-0 pb-1">
                <Typography variant="caption" color="textSecondary">
                  {label.short}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.find((day) => day !== null) ?? week.length}>
              {week.map((date, index) => {
                if (date === null) {
                  // Padding cells have no date; their column is their identity.
                  return <td key={`pad-${String(index)}`} />;
                }
                const isEdge = date === value.start || date === value.end;
                const isInRange = date > value.start && date < value.end;
                return (
                  <td
                    key={date}
                    role="gridcell"
                    aria-selected={isEdge || isInRange}
                    className={cn(
                      'p-0.5',
                      isInRange && 'bg-badge-active-background',
                      date === value.start &&
                        value.end > value.start &&
                        'rounded-l-md bg-badge-active-background',
                      date === value.end &&
                        value.end > value.start &&
                        'rounded-r-md bg-badge-active-background',
                    )}
                  >
                    <button
                      type="button"
                      data-date={date}
                      tabIndex={date === focused ? 0 : -1}
                      aria-label={fullDate.format(new Date(`${date}T00:00:00Z`))}
                      aria-current={date === today ? 'date' : undefined}
                      onClick={() => {
                        pick(date);
                      }}
                      onKeyDown={(event) => {
                        onKeyDown(event, date);
                      }}
                      className={cn(
                        'app-body2 app-tabular mx-auto flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent text-text-primary outline-none hover:bg-badge-active-background focus-visible:border-primary sm:size-10',
                        isWeekendIso(date) && !isEdge && 'text-text-secondary',
                        date === today && !isEdge && 'border-primary',
                        isEdge && 'bg-primary text-primary-contrast-text hover:bg-primary-dark',
                      )}
                    >
                      {Number(date.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
