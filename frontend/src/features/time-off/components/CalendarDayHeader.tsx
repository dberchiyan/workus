import Typography from '@mui/material/Typography';
import type { Ref } from 'react';
import { cn } from '@/shared/lib/cn';
import { isWeekendIso } from '../calendar';

export interface CalendarDayHeaderProps {
  date: string;
  today: boolean;
  weekday: string;
  ref?: Ref<HTMLTableCellElement>;
}

/** Day number over its short weekday; today in the primary colour with a dot. */
export function CalendarDayHeader({ date, today, weekday, ref }: CalendarDayHeaderProps) {
  return (
    <th
      ref={ref}
      scope="col"
      aria-current={today ? 'date' : undefined}
      className={cn(
        'font-normal relative border-b border-l border-divider px-0 pt-3 pb-2 text-center',
        isWeekendIso(date) && 'bg-badge-neutral-background/60',
        today && 'bg-primary/10 text-primary',
      )}
    >
      {today && (
        <span
          aria-hidden
          className="absolute top-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
        />
      )}
      <Typography
        variant="subtitle2"
        component="span"
        color="inherit"
        className="app-tabular block"
      >
        {Number(date.slice(8))}
      </Typography>
      <Typography
        variant="caption"
        component="span"
        color={today ? 'inherit' : 'textSecondary'}
        className="block uppercase"
      >
        {weekday}
      </Typography>
    </th>
  );
}
