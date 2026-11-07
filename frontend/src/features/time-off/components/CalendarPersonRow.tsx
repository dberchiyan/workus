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
  canOpenRequest: boolean;
  canOpenProfile: boolean;
}

/** The person (sticky on the left) and their month: free days, requests, days outside employment. */
export function CalendarPersonRow({
  row,
  days,
  today,
  canOpenRequest,
  canOpenProfile,
}: CalendarPersonRowProps) {
  const { employee } = row;
  const name = fullName(employee);
  const cells = calendarCells(days, row.requests, employee);
  return (
    <tr>
      <th
        scope="row"
        className="font-normal sticky left-0 z-10 border-b border-divider bg-background-paper px-3 py-2 text-left sm:px-4"
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
            className="border-b border-l border-divider p-0"
          >
            <CalendarBar request={cell.request} span={cell.span} linkToRequest={canOpenRequest} />
          </td>
        ) : cell.kind === 'outside' ? (
          <td
            key={cell.date}
            colSpan={cell.span}
            className={cn('h-14 border-b border-l border-divider p-0', NOT_EMPLOYED_PATTERN)}
          >
            <NotEmployedSpan reason={cell.reason} employee={employee} />
          </td>
        ) : (
          <td
            key={cell.date}
            className={cn(
              'h-14 border-b border-l border-divider p-0',
              isWeekendIso(cell.date) && 'bg-badge-neutral-background/60',
              cell.date === today && 'bg-primary/10',
            )}
          />
        ),
      )}
    </tr>
  );
}
