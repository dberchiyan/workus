import { useTranslation } from 'react-i18next';
import { TopProgressBar } from './TopProgressBar';

/** A page (or the app) is loading: the top bar, and the state for assistive tech. */
export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-busy="true" className="min-h-dvh">
      <TopProgressBar />
      <span className="sr-only">{t('status.loading')}</span>
    </div>
  );
}
