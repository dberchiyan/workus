import GroupOutlined from '@mui/icons-material/GroupOutlined';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import type { EmployeeProfile } from '../types';

export function ResponsiblesCard({ employee }: { employee: EmployeeProfile }) {
  const { t } = useTranslation('employee');
  return (
    <Card variant="outlined" className="flex-1">
      <CardContent className="flex flex-col gap-3 p-5">
        <Typography
          variant="subtitle2"
          component="h2"
          color="textSecondary"
          className="flex items-center gap-2"
        >
          <GroupOutlined aria-hidden fontSize="small" />
          {t('profile.responsible.title')}
        </Typography>
        {employee.responsibles.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            {t('profile.responsible.none')}
          </Typography>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {employee.responsibles.map((person) => (
              <li key={person.id} className="flex min-w-0 items-center gap-3">
                <InitialsAvatar
                  id={person.id}
                  firstName={person.firstName}
                  lastName={person.lastName}
                />
                <span className="flex min-w-0 flex-col">
                  <Typography variant="subtitle2" component="span" className="truncate">
                    {`${person.firstName} ${person.lastName}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    component="span"
                    color="textSecondary"
                    className="truncate"
                  >
                    {person.positionTitle ?? t(`profile.roles.${person.role}`)}
                  </Typography>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
