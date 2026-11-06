import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';

/** Placeholder dashboard until the first widgets exist. */
export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  useDocumentTitle(t('pageTitle'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  // RequireAuth renders this route only with a loaded user.
  const { data: user } = useCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Typography
        ref={headingRef}
        tabIndex={-1}
        variant="h4"
        component="h1"
        className="[overflow-wrap:anywhere] outline-none"
      >
        {t('title', { name: user.firstName })}
      </Typography>
      <Card variant="outlined">
        <CardContent className="p-6 sm:p-8">
          <Typography variant="body1" color="text.secondary" className="[overflow-wrap:anywhere]">
            {t('description', { email: user.email })}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}
