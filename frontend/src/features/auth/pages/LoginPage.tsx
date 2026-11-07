import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Navigate, Link as RouterLink } from 'react-router';
import { PATHS } from '@/shared/lib/paths';
import { PageLoader } from '@/shared/components/PageLoader';
import { PageShell } from '../components/PageShell';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { AppPreview } from '../components/AppPreview';
import { BrandLogo } from '../components/BrandLogo';
import { LoginForm } from '../components/LoginForm';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLoginRedirect } from '../hooks/useLoginRedirect';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  useDocumentTitle(t('login.pageTitle'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const { data: user, isPending } = useCurrentUser();
  const { target } = useLoginRedirect();

  if (isPending) {
    return <PageLoader />;
  }
  if (user) {
    return <Navigate to={target} replace />;
  }

  return (
    <PageShell className="items-center justify-center px-4 py-8 md:px-8">
      <div className="flex w-full max-w-7xl items-center justify-center gap-12 lg:items-stretch xl:gap-20">
        <div className="flex w-full max-w-md shrink-0 flex-col gap-8">
          <BrandLogo />
          <Card variant="outlined">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
              <Typography
                ref={headingRef}
                tabIndex={-1}
                variant="h4"
                component="h1"
                className="outline-none"
              >
                {t('login.title')}
              </Typography>
              <LoginForm />
            </CardContent>
          </Card>
          <Typography variant="body2" color="textSecondary" className="text-center">
            {t('login.noAccount')}{' '}
            <Link component={RouterLink} to={PATHS.signup}>
              {t('login.createCompany')}
            </Link>
          </Typography>
        </div>
        <AppPreview />
      </div>
    </PageShell>
  );
}
