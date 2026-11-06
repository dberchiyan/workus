import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { EmployeeStatus } from '../types';

/** Text, not only colour, carries the status. */
export function EmployeeStatusChip({ status }: { status: EmployeeStatus }) {
  const { t } = useTranslation('employee');
  return (
    <Chip
      size="small"
      label={t(`status.${status}`)}
      className={cn(
        status === 'ACTIVE'
          ? 'bg-success-light text-success-dark dark:text-success'
          : 'bg-background text-text-secondary',
      )}
    />
  );
}
