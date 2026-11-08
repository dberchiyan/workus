import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { CompanyStatus } from '../types';

const TONE: Record<CompanyStatus, string> = {
  PENDING: 'bg-badge-active-background text-badge-active-text',
  ACTIVE: 'bg-success/15 text-success',
  REJECTED: 'bg-error/10 text-error',
};

/** The company's status as a pill; the word carries it, the colour only helps. */
export function CompanyStatusChip({ status }: { status: CompanyStatus }) {
  const { t } = useTranslation('platform');
  return (
    <Typography
      variant="caption"
      component="span"
      className={cn('rounded-full px-2 whitespace-nowrap', TONE[status])}
    >
      {t(`status.${status}`)}
    </Typography>
  );
}
