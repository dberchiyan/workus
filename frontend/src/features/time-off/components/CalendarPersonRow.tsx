import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { cn } from '@/shared/lib/cn';
import { employeeProfilePath } from '@/shared/lib/paths';
import { calendarCells, isWeekendIso } from '../calendar';
import { fullName } from '../format';
import type { CalendarRow } from '../types';
import { CalendarBar } from './CalendarBar';
import { NotEmployedSpan } from './NotEmployedSpan';
import { NOT_EMPLOYED_PATTERN } from './timeOffVisuals';

export interface CalendarPersonRowProps {
  row: CalendarRow;
  days: string[];
  today: string;
  holidays: ReadonlyMap<string, string>;
  canOpenRequest: boolean;
  canOpenProfile: boolean;
}

/** The person (sticky on the left) and their month: free days, requests, days outside employment. */
export function CalendarPersonRow({
  row,
  days,
  today,
  holidays,
  canOpenRequest,
  canOpenProfile,
}: CalendarPersonRowProps) {
  const { employee } = row;
  const name = fullName(employee);
  const cells = calendarCells(days, row.requests, employee);
  const todayIndex = days.indexOf(today);
  /** Today's place inside a cell that spans several days, if it is there. */
  const todayIn = (date: string, span: number) => {
    const offset = todayIndex - days.indexOf(date);
    return todayIndex >= 0 && offset >= 0 && offset < span ? offset : undefined;
  };
  return (
    <tr>
      <th
        scope="row"
        className="app-scroll-shadow font-normal sticky left-0 z-10 border-b border-divider bg-background-paper px-3 py-2 text-left sm:px-4"
      >
        <span className="flex min-w-0 items-center gap-3">
          <InitialsAvatar
            id={employee.userId}
            firstName={employee.firstName}
            lastName={employee.lastName}
            className="hidden sm:flex"
          />
          <span className="flex min-w-0 flex-col">
            {canOpenProfile ? (
              <Link
                component={RouterLink}
                to={employeeProfilePath(employee.id)}
                variant="subtitle2"
                color="textPrimary"
                underline="hover"
                className="truncate"
              >
                {name}
              </Link>
            ) : (
              <Typography variant="subtitle2" component="span" className="truncate">
                {name}
              </Typography>
            )}
            <Typography variant="caption" color="textSecondary" className="truncate">
              {employee.positionTitle}
            </Typography>
          </span>
        </span>
      </th>
      {cells.map((cell) =>
        cell.kind === 'request' ? (
          <td
            key={cell.request.id}
            colSpan={cell.span}
            className="relative border-b border-l border-divider p-0"
          >
            <CalendarBar request={cell.request} span={cell.span} linkToRequest={canOpenRequest} />
            <TodayBand offset={todayIn(cell.date, cell.span)} span={cell.span} />
          </td>
        ) : cell.kind === 'outside' ? (
          <td
            key={cell.date}
            colSpan={cell.span}
            className={cn(
              'relative h-14 border-b border-l border-divider p-0',
              NOT_EMPLOYED_PATTERN,
            )}
          >
            <NotEmployedSpan reason={cell.reason} employee={employee} />
            <TodayBand offset={todayIn(cell.date, cell.span)} span={cell.span} />
          </td>
        ) : (
          <td
            key={cell.date}
            className={cn(
              'h-14 border-b border-l border-divider p-0',
              isWeekendIso(cell.date) && 'bg-badge-neutral-background/60',
              holidays.has(cell.date) && 'bg-error/10',
              cell.date === today && 'bg-primary/10',
            )}
          />
        ),
      )}
    </tr>
  );
}

/**
 * Today's tint over a cell that spans several days (a request, days outside employment), so the
 * column reads as one band from the header down; clicks and hovers pass through.
 */
function TodayBand({ offset, span }: { offset: number | undefined; span: number }) {
  if (offset === undefined) {
    return null;
  }
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-1 bg-primary/10"
      style={{ left: `${(offset / span) * 100}%`, width: `${100 / span}%` }}
    />
  );
}
