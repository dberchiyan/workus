import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { ResponsibleStack } from '@/shared/components/ResponsibleStack';
import type { EmployeeListItem } from '../types';

export interface ResponsibleAvatarsProps {
  employee: Pick<EmployeeListItem, 'responsibles' | 'responsibleCount'>;
}

/** One person: avatar and name; more: overlapping avatars, all names on hover. */
export function ResponsibleAvatars({ employee }: ResponsibleAvatarsProps) {
  const { t } = useTranslation('employee');
  if (employee.responsibles.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        {t('responsibles.none')}
      </Typography>
    );
  }
  return (
    <ResponsibleStack
      people={employee.responsibles}
      total={employee.responsibleCount}
      showSoleName
    />
  );
}
