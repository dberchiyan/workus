import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router';
import { employeeProfilePath } from '@/shared/lib/paths';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { cn } from '@/shared/lib/cn';
import { usePrefetchEmployeeProfile } from '../hooks/useEmployeeQueries';
import type { EmployeeListItem } from '../types';
import { ViewTransition } from 'react';
import { personAvatarTransition } from '@/shared/lib/viewTransitionNames';

export interface EmployeeIdentityProps {
  employee: Pick<EmployeeListItem, 'id' | 'userId' | 'firstName' | 'lastName' | 'email'>;
  /** Table cell: one line each, cut with "…" (the full text is in the tooltip). */
  isCompact?: boolean;
}

/**
 * The name links to the profile and its ::after stretches over the whole row/card (which is
 * `relative`), so a click anywhere opens it while keyboard and screen readers get one real link.
 */
const STRETCHED_LINK = 'after:absolute after:inset-0';

/** Avatar, full name and email. */
export function EmployeeIdentity({ employee, isCompact = false }: EmployeeIdentityProps) {
  const name = `${employee.firstName} ${employee.lastName}`;
  const { search } = useLocation();
  const prefetch = usePrefetchEmployeeProfile();
  const textClass = isCompact ? 'truncate' : '[overflow-wrap:anywhere]';
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ViewTransition name={personAvatarTransition(employee.id)}>
        <InitialsAvatar
          id={employee.userId}
          firstName={employee.firstName}
          lastName={employee.lastName}
        />
      </ViewTransition>
      <div className="flex min-w-0 flex-col">
        <Typography
          variant="subtitle2"
          component="span"
          className={textClass}
          title={isCompact ? name : undefined}
        >
          <Link
            component={RouterLink}
            to={employeeProfilePath(employee.id)}
            color="inherit"
            underline="hover"
            state={{ from: search }}
            onMouseEnter={() => {
              prefetch(employee.id);
            }}
            onFocus={() => {
              prefetch(employee.id);
            }}
            className={STRETCHED_LINK}
          >
            {name}
          </Link>
        </Typography>
        <Typography
          variant="caption"
          component="span"
          color="textSecondary"
          className={cn(textClass)}
          title={isCompact ? employee.email : undefined}
        >
          {employee.email}
        </Typography>
      </div>
    </div>
  );
}
