import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { formatCalendarDate } from '../format';
import type { EmployeeProfile } from '../types';
import { EmployeeStatusChip } from './EmployeeStatusChip';
import { ProfileActions } from './ProfileActions';
import { ViewTransition } from 'react';
import { personAvatarTransition } from '@/shared/lib/viewTransitionNames';

export interface ProfileHeaderProps {
  employee: EmployeeProfile;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/** Name, position, status (with the termination, if any) and the profile actions. */
export function ProfileHeader({ employee, headingRef }: ProfileHeaderProps) {
  const { t, i18n } = useTranslation('employee');
  const termination =
    employee.termination && employee.terminatedOn
      ? t(
          employee.status === 'TERMINATED'
            ? 'profile.termination.since'
            : 'profile.termination.leaves',
          {
            date: formatCalendarDate(employee.terminatedOn, i18n.language),
            reason: t(`termination.reasons.${employee.termination.reason}`),
          },
        )
      : null;
  return (
    <Card variant="outlined" className="flex-1">
      {/* Phone: avatar and actions on top, the text full width below; side by side from sm. */}
      <CardContent className="flex flex-wrap items-start gap-4 p-5 sm:flex-nowrap sm:items-center sm:p-6">
        <ViewTransition name={personAvatarTransition(employee.id)}>
          <InitialsAvatar
            id={employee.userId}
            firstName={employee.firstName}
            lastName={employee.lastName}
            size="lg"
          />
        </ViewTransition>
        <div className="order-3 flex min-w-0 basis-full flex-col gap-1 sm:order-none sm:flex-1 sm:basis-auto">
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
          {termination && (
            <Typography
              variant="body2"
              color={employee.status === 'TERMINATED' ? 'textSecondary' : 'warning'}
              className="flex items-center gap-1"
            >
              <EventBusyOutlined aria-hidden fontSize="small" />
              {termination}
            </Typography>
          )}
        </div>
        <div className="order-2 -mt-1 -mr-2 ml-auto self-start sm:order-none">
          <ProfileActions employee={employee} />
        </div>
      </CardContent>
    </Card>
  );
}
