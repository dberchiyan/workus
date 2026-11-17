import LockOutlined from '@mui/icons-material/LockOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { settingsPath } from '@/shared/lib/paths';
import type { Schemas } from '@/shared/types';

type Plan = Schemas['Plan_Output'];
type PlanFeature = Schemas['PlanFeature_Output'];

/** What is locked: a feature of a higher plan, or the plan's employee limit. */
export type UpgradeReason = { kind: 'feature'; feature: PlanFeature } | { kind: 'limit'; limit: number; count: number };

export interface UpgradePromptProps {
    reason: UpgradeReason;
    /** The cheapest plan that lifts the lock (named in the text). */
    requiredPlan: Plan;
    /** Owners get the button to Settings → Billing; everyone else is told to ask an owner. */
    hasBillingAccount: boolean;
    /** One line with the action beside it (page notices) instead of the centred block. */
    compact?: boolean;
    className?: string;
}

/**
 * Shown where a plan's limit or a locked feature is hit (reviews, insights, structure,
 * exports, the employee limit). The API refuses the action too — this only says what to do.
 */
export function UpgradePrompt({
    reason,
    requiredPlan,
    hasBillingAccount,
    compact = false,
    className,
}: UpgradePromptProps) {
    const { t, i18n } = useTranslation();
    const planName = t(`plans.${requiredPlan}`);
    const number = new Intl.NumberFormat(i18n.language);
    const title =
        reason.kind === 'feature'
            ? t(`upgrade.features.${reason.feature}.title`)
            : t('upgrade.limit.title', { limit: number.format(reason.limit) });
    const description =
        reason.kind === 'feature'
            ? t(`upgrade.features.${reason.feature}.description`, { plan: planName })
            : t('upgrade.limit.description', {
                  count: reason.count,
                  people: number.format(reason.count),
                  limit: number.format(reason.limit),
                  plan: planName,
              });
    const action = hasBillingAccount ? (
        <Button
            component={RouterLink}
            to={settingsPath('billing')}
            variant={compact ? 'outlined' : 'contained'}
            size={compact ? 'small' : 'medium'}
            color={compact ? 'inherit' : 'primary'}
            className="whitespace-nowrap"
        >
            {t('upgrade.seePlans')}
        </Button>
    ) : (
        <Typography variant="body2" color="textSecondary">
            {t('upgrade.askOwner')}
        </Typography>
    );

    if (compact) {
        return (
            <Alert
                severity="info"
                icon={<LockOutlined fontSize="inherit" />}
                action={action}
                className={cn('items-center', className)}
            >
                <Typography variant="subtitle2" component="span">
                    {title}.
                </Typography>{' '}
                {description}
            </Alert>
        );
    }
    return (
        <div className={cn('flex flex-col items-center gap-3 px-4 py-12 text-center', className)}>
            <span
                aria-hidden
                className="rounded-2xl flex size-14 items-center justify-center bg-badge-active-background text-badge-active-text"
            >
                <LockOutlined />
            </span>
            <Typography variant="h6" component="p">
                {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" className="max-w-md">
                {description}
            </Typography>
            <Typography variant="caption" color="textSecondary">
                {t('upgrade.plan', { plan: planName })}
            </Typography>
            {action}
        </div>
    );
}
