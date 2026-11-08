import ScienceOutlined from '@mui/icons-material/ScienceOutlined';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useDemoMode } from '@/features/auth';

/** A thin strip above the top bar in the public demo, aligned to the content column. */
export function DemoBanner() {
  const { t } = useTranslation('shell');
  if (!useDemoMode()) {
    return null;
  }
  return (
    <div role="note" className="border-b border-divider bg-background-paper px-4 py-2 md:px-8">
      <div className="mx-auto flex w-full max-w-page items-center gap-2">
        <ScienceOutlined aria-hidden fontSize="small" color="primary" />
        <Typography variant="body2" color="textSecondary">
          {t('demo.banner')}
        </Typography>
      </div>
    </div>
  );
}
