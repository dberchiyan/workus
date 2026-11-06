import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import type { NavSection } from '../navigation';

export interface SectionPlaceholderPageProps {
  section: Exclude<NavSection, 'dashboard'>;
}

/** Stand-in for a section until its feature is built. */
export default function SectionPlaceholderPage({ section }: SectionPlaceholderPageProps) {
  const { t } = useTranslation('shell');
  const title = t(`nav.${section}`);
  useDocumentTitle(t('placeholder.pageTitle', { section: title }));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Typography
        ref={headingRef}
        tabIndex={-1}
        variant="h4"
        component="h1"
        className="outline-none"
      >
        {title}
      </Typography>
      <Card variant="outlined">
        <CardContent className="p-6 sm:p-8">
          <Typography variant="body1" color="textSecondary">
            {t('placeholder.description')}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}
