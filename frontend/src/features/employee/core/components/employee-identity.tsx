import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { ViewTransition } from 'react';
import { Link as RouterLink, useLocation } from 'react-router';

import { InitialsAvatar } from '@/shared/components/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { employeeProfilePath } from '@/shared/lib/paths';
import { personAvatarTransition } from '@/shared/lib/view-transition-names';

import { usePrefetchEmployeeProfile } from '../hooks/use-employee-queries';
import type { EmployeeListItem } from '../types';

export interface EmployeeIdentityProps {
    employee: Pick<EmployeeListItem, 'id' | 'userId' | 'firstName' | 'lastName' | 'email'>;
    isCompact?: boolean;
}

const STRETCHED_LINK = 'after:absolute after:inset-0';

/** Avatar, full name and email. */
export function EmployeeIdentity({ employee, isCompact = false }: EmployeeIdentityProps): ReactElement {
    const name = `${employee.firstName} ${employee.lastName}`;
    const { search } = useLocation();
    const prefetch = usePrefetchEmployeeProfile();
    const textClass = isCompact ? 'truncate' : '[overflow-wrap:anywhere]';
    return (
        <div className="flex min-w-0 items-center gap-3">
            <ViewTransition name={personAvatarTransition(employee.id)}>
                <InitialsAvatar id={employee.userId} firstName={employee.firstName} lastName={employee.lastName} />
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
