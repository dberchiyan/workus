import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { useAccess, usePlan } from '@/features/auth';
import { settingsPath } from '@/shared/lib/paths';

/** Owners of a company whose last payment failed see it on every page until it is fixed. */
export function BillingBanner() {
    const { t, i18n } = useTranslation('billing');
    const can = useAccess();
    const { pastDueUntil } = usePlan();
    if (!pastDueUntil || !can('billing.banner')) {
        return null;
    }
    const date = new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'long',
        timeZone: 'UTC',
    }).format(new Date(pastDueUntil));
    return (
        <Alert
            severity="warning"
            role="status"
            className="items-center"
            action={
                <Button component={RouterLink} to={settingsPath('billing')} color="inherit" size="small">
                    {t('banner.open')}
                </Button>
            }
        >
            {t('banner.pastDue', { date })}
        </Alert>
    );
}
