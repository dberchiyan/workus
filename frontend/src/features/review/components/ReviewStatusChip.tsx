import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { ReviewStatus } from '../types';

/** Text carries the status; colour only supports it. */
export function ReviewStatusChip({ status }: { status: ReviewStatus }) {
  const { t } = useTranslation('review');
  return (
    <Chip
      size="small"
      label={t(`status.${status}`)}
      className={cn(
        status === 'COMPLETED' && 'bg-success-light text-success-dark dark:text-success',
        status === 'SCHEDULED' && 'bg-badge-active-background text-badge-active-text',
        status === 'CANCELED' && 'bg-badge-neutral-background text-badge-neutral-text',
      )}
    />
  );
}
