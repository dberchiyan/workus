import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { lastApiActivity } from '@/shared/api/activity';
import { PATHS } from '@/shared/lib/paths';
import { authKeys } from '../hooks/queryKeys';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLogout } from '../hooks/useLogout';
import type { LoginLocationState } from '../hooks/useLoginRedirect';

/** The warning shows this long before the session ends. */
const WARNING_MS = 2 * 60_000;
/** The server records activity at most once a minute — count a minute short to be safe. */
const SAFETY_MS = 60_000;
const TICK_MS = 1_000;

const countdown = (ms: number): string => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
};

/**
 * Two minutes before an idle session ends, an accessible dialog offers "Stay signed in"
 * (ux.md → idle-timeout warning); when time is up the app returns to sign-in, saying why.
 */
export function IdleSessionWarning() {
  const { t } = useTranslation('auth');
  const idleMinutes = useCurrentUser().data?.idleTimeoutMinutes;
  const queryClient = useQueryClient();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const titleId = useId();
  const textId = useId();
  const stayRef = useRef<HTMLButtonElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const [staying, setStaying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const remaining =
    idleMinutes === undefined
      ? Infinity
      : lastApiActivity() + idleMinutes * 60_000 - SAFETY_MS - now;
  const open = remaining > 0 && remaining <= WARNING_MS;

  // Time is up: the session is gone on the server too — go to sign-in and say why.
  useEffect(() => {
    if (remaining > 0) {
      return;
    }
    queryClient.clear();
    const state: LoginLocationState = {
      from: `${location.pathname}${location.search}${location.hash}`,
      reason: 'sessionExpired',
    };
    void navigate(PATHS.login, { replace: true, state });
  }, [remaining, queryClient, navigate, location]);

  const stay = async () => {
    setStaying(true);
    try {
      // Any request counts as activity; this one also re-reads who is signed in.
      await queryClient.refetchQueries({ queryKey: authKeys.me() });
    } finally {
      setStaying(false);
      setNow(Date.now());
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={textId}
      // The dialog opens on the safe choice (ux.md → focus moves with the UI). The focus trap
      // may put focus on the dialog itself (e.g. after a page moved focus to its heading):
      // hand it on to the button.
      slotProps={{ transition: { onEntered: () => stayRef.current?.focus() } }}
      onFocus={(event) => {
        // Focus on the backdrop container (outside the dialog box itself) goes to the button.
        if (event.target instanceof HTMLElement && !event.target.closest('[role="dialog"]')) {
          stayRef.current?.focus();
        }
      }}
    >
      <DialogTitle id={titleId}>{t('idle.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id={textId}>
          {t('idle.text', { time: countdown(remaining) })}
        </DialogContentText>
      </DialogContent>
      <DialogActions className="px-4 py-3 sm:px-6">
        <Button
          onClick={() => {
            logout.mutate();
          }}
          disabled={staying || logout.isPending}
        >
          {t('idle.signOut')}
        </Button>
        <Button ref={stayRef} variant="contained" loading={staying} onClick={() => void stay()}>
          {t('idle.stay')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
