import { useTranslation } from 'react-i18next';
import { StatusBadge, type StatusTone } from '@/shared/components/status-badge';
import type { CompanyStatus } from '../types';

const TONE: Record<CompanyStatus, StatusTone> = {
    PENDING: 'warning',
    ACTIVE: 'success',
    REJECTED: 'danger',
};

export function CompanyStatusChip({ status }: { status: CompanyStatus }) {
    const { t } = useTranslation('platform');
    return <StatusBadge tone={TONE[status]} label={t(`status.${status}`)} />;
}
