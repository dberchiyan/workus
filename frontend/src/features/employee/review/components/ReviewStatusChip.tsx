import { useTranslation } from 'react-i18next';
import { StatusBadge, type StatusTone } from '@/shared/components/StatusBadge';
import type { ReviewStatus } from '../types';

const TONE: Record<ReviewStatus, StatusTone> = {
  SCHEDULED: 'info',
  COMPLETED: 'success',
  CANCELED: 'neutral',
};

export function ReviewStatusChip({ status }: { status: ReviewStatus }) {
  const { t } = useTranslation('review');
  return <StatusBadge tone={TONE[status]} label={t(`status.${status}`)} />;
}
