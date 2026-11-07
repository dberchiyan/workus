import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { employeeProfilePath } from '@/shared/lib/paths';
import type { InsightPerson } from '../types';

/** Avatar, name (to the profile), position, and something on the right. */
export function PersonLine({ person, end }: { person: InsightPerson; end?: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <InitialsAvatar id={person.userId} firstName={person.firstName} lastName={person.lastName} />
      <span className="flex min-w-0 flex-1 flex-col">
        <Link
          component={RouterLink}
          to={employeeProfilePath(person.employeeId)}
          variant="subtitle2"
          color="textPrimary"
          underline="hover"
          className="truncate"
        >
          {`${person.firstName} ${person.lastName}`}
        </Link>
        <Typography variant="caption" color="textSecondary" className="truncate">
          {person.positionTitle}
        </Typography>
      </span>
      {end}
    </span>
  );
}
