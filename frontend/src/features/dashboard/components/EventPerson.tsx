import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { employeeProfilePath } from '@/shared/lib/paths';

export interface EventPersonProps {
  employee: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    positionTitle: string;
  };
}

/** Avatar, name (to the profile) and position. */
export function EventPerson({ employee }: EventPersonProps) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <InitialsAvatar
        id={employee.userId}
        firstName={employee.firstName}
        lastName={employee.lastName}
      />
      <span className="flex min-w-0 flex-col">
        <Link
          component={RouterLink}
          to={employeeProfilePath(employee.id)}
          variant="subtitle2"
          color="textPrimary"
          underline="hover"
          className="truncate"
        >
          {`${employee.firstName} ${employee.lastName}`}
        </Link>
        <Typography variant="caption" color="textSecondary" className="truncate">
          {employee.positionTitle}
        </Typography>
      </span>
    </span>
  );
}
