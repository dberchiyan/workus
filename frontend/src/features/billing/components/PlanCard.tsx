import CheckOutlined from '@mui/icons-material/CheckOutlined';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/money';
import type { PlanOffer } from '../types';

/** What every plan has, listed before the plan's own features. */
const BASE_FEATURES = ['directory', 'timeOff', 'calendar'] as const;

export interface PlanCardProps {
    offer: PlanOffer;
    isCurrent: boolean;
    /** The plan the subscription switches to at the period end. */
    isScheduled?: boolean;
    /** What the button does, if there is one. */
    action?: { label: string; onClick: () => void; loading: boolean } | undefined;
}

/** One column of the pricing table: price, limit, features, the current plan marked. */
export function PlanCard({ offer, isCurrent, isScheduled = false, action }: PlanCardProps) {
    const { t, i18n } = useTranslation('billing');
    const number = new Intl.NumberFormat(i18n.language);
    return (
        <Card
            variant="outlined"
            className={cn('flex flex-col gap-4 p-5', isCurrent && 'border-primary')}
            aria-current={isCurrent ? 'true' : undefined}
        >
            <div className="flex items-start justify-between gap-2">
                <Typography variant="h6" component="h3">
                    {offer.name}
                </Typography>
                {isCurrent && <StatusBadge tone="success" label={t('plans.current')} />}
                {isScheduled && <StatusBadge tone="info" label={t('plans.scheduled')} />}
            </div>
            <div className="flex items-baseline gap-1">
                <Typography variant="metric" component="p">
                    {formatMoney(offer.monthlyPrice, i18n.language)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {t('plans.perMonth')}
                </Typography>
            </div>
            <Typography variant="subtitle2" component="p">
                {offer.maxEmployees === null
                    ? t('plans.unlimited')
                    : t('plans.upTo', {
                          count: offer.maxEmployees,
                          limit: number.format(offer.maxEmployees),
                      })}
            </Typography>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {[...BASE_FEATURES, ...offer.features].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                        <CheckOutlined aria-hidden fontSize="small" className="mt-0.5 shrink-0 text-success" />
                        <Typography variant="body2">{t(`plans.features.${feature}`)}</Typography>
                    </li>
                ))}
            </ul>
            {action && (
                <Button
                    variant={isCurrent ? 'outlined' : 'contained'}
                    onClick={action.onClick}
                    loading={action.loading}
                    className="mt-auto"
                >
                    {action.label}
                </Button>
            )}
        </Card>
    );
}
