import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Navigate, Link as RouterLink } from 'react-router';
import { BrandLogo, PageShell, useCurrentUser } from '@/features/auth';
import { PageLoader } from '@/shared/components/PageLoader';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { PATHS } from '@/shared/lib/paths';
import { SignupForm } from '../components/SignupForm';

/** Register a company: its first account becomes the owner. Signed-in people go to the app. */
export default function SignupPage() {
  const { t } = useTranslation('organisation');
  useDocumentTitle(t('signup.pageTitle'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const { data: user, isPending } = useCurrentUser();

  if (isPending) {
    return <PageLoader />;
  }
  if (user) {
    return <Navigate to={PATHS.dashboard} replace />;
  }

  return (
    <PageShell className="items-center justify-center px-4 py-8 md:px-8">
      <div className="flex w-full max-w-md flex-col gap-8">
        <BrandLogo />
        <Card variant="outlined">
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-1">
              <Typography
                ref={headingRef}
                tabIndex={-1}
                variant="h4"
                component="h1"
                className="outline-none"
              >
                {t('signup.title')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('signup.subtitle')}
              </Typography>
            </div>
            <SignupForm />
          </CardContent>
        </Card>
        <Typography variant="body2" color="textSecondary" className="text-center">
          {t('signup.haveAccount')}{' '}
          <Link component={RouterLink} to={PATHS.login}>
            {t('signup.signIn')}
          </Link>
        </Typography>
      </div>
    </PageShell>
  );
}
