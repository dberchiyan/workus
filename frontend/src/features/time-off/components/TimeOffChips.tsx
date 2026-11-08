import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import { StatusBadge, type StatusTone } from '@/shared/components/StatusBadge';
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

const STATUS_TONE: Record<TimeOffStatus, StatusTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELED: 'neutral',
};

export function TimeOffStatusChip({ status }: { status: TimeOffStatus }) {
  const { t } = useTranslation('timeOff');
  return <StatusBadge tone={STATUS_TONE[status]} label={t(`status.${status}`)} />;
}
