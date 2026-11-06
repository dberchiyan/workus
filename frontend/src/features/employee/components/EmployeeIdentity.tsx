import Typography from '@mui/material/Typography';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { cn } from '@/shared/lib/cn';
import type { EmployeeListItem } from '../types';

export interface EmployeeIdentityProps {
  employee: Pick<EmployeeListItem, 'userId' | 'firstName' | 'lastName' | 'email'>;
  /** Table cell: one line each, cut with "…" (the full text is in the tooltip). */
  isCompact?: boolean;
}

/** Avatar, full name and email. */
export function EmployeeIdentity({ employee, isCompact = false }: EmployeeIdentityProps) {
  const name = `${employee.firstName} ${employee.lastName}`;
  const textClass = isCompact ? 'truncate' : '[overflow-wrap:anywhere]';
  return (
    <div className="flex min-w-0 items-center gap-3">
      <InitialsAvatar
        id={employee.userId}
        firstName={employee.firstName}
        lastName={employee.lastName}
      />
      <div className="flex min-w-0 flex-col">
        <Typography
          variant="subtitle2"
          component="span"
          className={textClass}
          title={isCompact ? name : undefined}
        >
          {name}
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
