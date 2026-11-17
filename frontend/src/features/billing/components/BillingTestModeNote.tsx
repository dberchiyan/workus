import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useBillingInfo } from '../hooks/useBillingQueries';

/** The demo's test card, shown on the sign-in page while payments run against test keys. */
export function BillingTestModeNote() {
    const { t } = useTranslation('billing');
    const info = useBillingInfo();
    if (!info.data?.testMode) {
        return null;
    }
    return (
        <Alert severity="info" className="text-left">
            <Typography variant="subtitle2" component="span">
                {t('testMode.title')}
            </Typography>{' '}
            {t('testMode.card')}
        </Alert>
    );
}
