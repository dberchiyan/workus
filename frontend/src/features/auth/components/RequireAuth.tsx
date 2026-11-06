import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router';
import { isApiError } from '@/shared/api/apiError';
import { PageLoader } from '@/shared/components/PageLoader';
import { PATHS } from '@/shared/lib/paths';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { LoginLocationState } from '../hooks/useLoginRedirect';

/** App start → me: 200 → app · 401 → sign-in, remembering the intended path. */
export function RequireAuth() {
  const { t } = useTranslation(['common', 'errors']);
  const location = useLocation();
  const { data: user, isPending, isError, error, refetch, isRefetching } = useCurrentUser();

  if (isPending) {
    return <PageLoader />;
  }
  if (isError) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <Alert severity="error" role="alert">
          {t(`errors:${isApiError(error) ? error.code : 'INTERNAL_ERROR'}`)}
        </Alert>
        <Button
          variant="contained"
          className="self-start"
          disabled={isRefetching}
          onClick={() => {
            void refetch();
          }}
        >
          {t('errorBoundary.retry')}
        </Button>
      </div>
    );
  }
  if (!user) {
    const state: LoginLocationState = {
      from: `${location.pathname}${location.search}${location.hash}`,
    };
    return <Navigate to={PATHS.login} replace state={state} />;
  }
  return <Outlet />;
}
