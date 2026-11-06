import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import type { EmployeeProfile } from '../types';
import { EmployeeStatusChip } from './EmployeeStatusChip';

export interface ProfileHeaderProps {
  employee: EmployeeProfile;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/** Name, position and status. Profile actions (edit, terminate) will sit on the right. */
export function ProfileHeader({ employee, headingRef }: ProfileHeaderProps) {
  const { t } = useTranslation('employee');
  return (
    <Card variant="outlined" className="flex-1">
      <CardContent className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <InitialsAvatar
          id={employee.userId}
          firstName={employee.firstName}
          lastName={employee.lastName}
          size="lg"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Typography
              ref={headingRef}
              tabIndex={-1}
              variant="h4"
              component="h1"
              className="[overflow-wrap:anywhere] outline-none"
            >
              {`${employee.firstName} ${employee.lastName}`}
            </Typography>
            <EmployeeStatusChip status={employee.status} />
          </div>
          <Typography variant="body1" color="textSecondary">
            {`${employee.position.title} · ${employee.position.category.name}`}
          </Typography>
          <Typography variant="body2" color="textSecondary" className="[overflow-wrap:anywhere]">
            {employee.email}
            <span className="sr-only">{`, ${t(`profile.roles.${employee.role}`)}`}</span>
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}
