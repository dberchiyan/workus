import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import HighlightOffOutlined from '@mui/icons-material/HighlightOffOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import {
  authKeys,
  BrandLogo,
  PageShell,
  useAccess,
  useCurrentUser,
  useLogout,
} from '@/features/auth';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';

/** How often a waiting company checks whether it was approved. */
const RECHECK_MS = 60_000;

/**
 * The app opens only for an approved company. While it waits for a Workus platform admin (or was
 * rejected) its owner sees this screen — the status re-checked every minute, so approval opens the
 * app without signing in again. Platform admins have no company to wait for.
 */
export function OrganisationGate() {
  const { data: user } = useCurrentUser();
  const can = useAccess();
  const status = user?.organisation.status;
  const isOpen = status === 'ACTIVE' || can('section.companies');
  return isOpen ? <Outlet /> : <OrganisationStatusScreen />;
}

function OrganisationStatusScreen() {
  const { t } = useTranslation('organisation');
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const isRejected = user?.organisation.status === 'REJECTED';
  useDocumentTitle(isRejected ? t('gate.rejected.title') : t('gate.pending.title'));

  useEffect(() => {
    const id = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    }, RECHECK_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [queryClient]);

  if (!user) {
    return null;
  }
  const Icon = isRejected ? HighlightOffOutlined : HourglassEmptyOutlined;
  return (
    <PageShell className="items-center justify-center px-4 py-8 md:px-8">
      <div className="flex w-full max-w-md flex-col gap-8">
        <BrandLogo />
        <Card variant="outlined">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
            <Icon
              aria-hidden
              fontSize="large"
              className={isRejected ? 'text-error' : 'text-primary'}
            />
            <Typography
              ref={headingRef}
              tabIndex={-1}
              variant="h5"
              component="h1"
              className="outline-none"
            >
              {isRejected ? t('gate.rejected.title') : t('gate.pending.title')}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {isRejected
                ? t('gate.rejected.text', { company: user.organisation.name })
                : t('gate.pending.text', { company: user.organisation.name })}
            </Typography>
            {isRejected && user.organisation.rejectionReason && (
              <Alert severity="error" className="w-full text-left">
                {user.organisation.rejectionReason}
              </Alert>
            )}
            {!isRejected && (
              <Typography variant="caption" color="textSecondary" role="status">
                {t('gate.pending.hint')}
              </Typography>
            )}
            <Button
              variant="outlined"
              disabled={logout.isPending}
              onClick={() => {
                logout.mutate();
              }}
            >
              {t('gate.signOut')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
