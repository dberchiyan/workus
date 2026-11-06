import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4"
      role="status"
      aria-busy="true"
    >
      <CircularProgress aria-hidden />
      <Typography variant="body2">{t('status.loading')}</Typography>
    </div>
  );
}
