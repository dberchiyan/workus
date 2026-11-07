import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { requestPath } from '@/shared/lib/paths';
import { fullName } from '../format';
import type { ManagedRequest } from '../types';

export interface RequestPersonProps {
  request: ManagedRequest;
  /** The name opens the request; its accessible name says which one. */
  label: string;
}

/** Whose request it is: avatar, name (opens the request) and position. */
export function RequestPerson({ request, label }: RequestPersonProps) {
  const { employee } = request;
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
          to={requestPath(request.id)}
          aria-label={label}
          underline="hover"
          color="inherit"
          className="truncate"
        >
          <Typography variant="subtitle2" component="span">
            {fullName(employee)}
          </Typography>
        </Link>
        <Typography variant="caption" color="textSecondary" className="truncate">
          {employee.positionTitle}
        </Typography>
      </span>
    </span>
  );
}
