import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/shared/components/BrandMark';

/** Workus mark + wordmark + tagline. */
export function BrandLogo() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-3">
        <BrandMark />
        <Typography variant="h2" component="p" className="text-secondary dark:text-text-primary">
          {t('app.name')}
        </Typography>
      </div>
      <Typography variant="subtitle1" component="p" color="textSecondary">
        {t('app.tagline')}
      </Typography>
    </div>
  );
}
