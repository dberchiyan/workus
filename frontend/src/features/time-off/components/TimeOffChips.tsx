import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { TimeOffStatus, TimeOffType } from '../types';
import { TYPE_VISUALS } from './timeOffVisuals';

/** Type: its icon and name; colour only supports the text. */
export function TimeOffTypeChip({ type }: { type: TimeOffType }) {
  const { t } = useTranslation('timeOff');
  const { icon: Icon, text } = TYPE_VISUALS[type];
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<Icon aria-hidden fontSize="small" className={text} />}
      label={t(`types.${type}`)}
    />
  );
}

/** Text carries the status; colour only supports it. */
export function TimeOffStatusChip({ status }: { status: TimeOffStatus }) {
  const { t } = useTranslation('timeOff');
  return (
    <Chip
      size="small"
      label={t(`status.${status}`)}
      className={cn(
        status === 'PENDING' && 'bg-badge-active-background text-badge-active-text',
        status === 'APPROVED' && 'bg-success-light text-success-dark dark:text-success',
        status === 'REJECTED' && 'bg-badge-neutral-background text-error',
        status === 'CANCELED' && 'bg-badge-neutral-background text-badge-neutral-text',
      )}
    />
  );
}
