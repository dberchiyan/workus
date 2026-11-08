import { useTranslation } from 'react-i18next';
import { StatusBadge, type StatusTone } from '@/shared/components/StatusBadge';
import type { EmployeeStatus } from '../types';

const TONE: Record<EmployeeStatus, StatusTone> = { ACTIVE: 'success', TERMINATED: 'neutral' };

export function EmployeeStatusChip({ status }: { status: EmployeeStatus }) {
  const { t } = useTranslation('employee');
  return <StatusBadge tone={TONE[status]} label={t(`status.${status}`)} />;
}
