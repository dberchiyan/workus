import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SESSIONS_PAGE_SIZE,
  useEndOtherSessions,
  useEndSession,
  useSessions,
} from '@/features/auth';
import { useUrlPage } from '../useUrlPage';
import { SessionRow } from './SessionRow';
import { SettingsCard } from './SettingsCard';

/** This device first, then the others five a page; sign out one or all of them. */
export function SessionsSection() {
  const { t, i18n } = useTranslation(['settings', 'errors']);
  const [page, goTo] = useUrlPage();
  const sessions = useSessions(page);
  const endOne = useEndSession();
  const endOthers = useEndOtherSessions();
  const [confirming, setConfirming] = useState(false);
  const titleId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const others = sessions.data?.others;
  const total = others?.totalElements ?? 0;
  const pages = Math.max(1, Math.ceil(total / SESSIONS_PAGE_SIZE));
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);

  // Signing out the last session of a page leaves it empty: show the last page that has some.
  useEffect(() => {
    if (others && others.content.length === 0 && page > 0) {
      goTo(Math.max(0, pages - 1));
    }
  });
  useEffect(() => {
    if (confirming) {
      requestAnimationFrame(() => keepRef.current?.focus());
    }
  }, [confirming]);

  const failure = endOne.error ?? endOthers.error;
  const from = page * SESSIONS_PAGE_SIZE + 1;
  const to = Math.min(total, from + SESSIONS_PAGE_SIZE - 1);

  return (
    <SettingsCard
      id="settings-sessions"
      title={t('sessions.title')}
      description={t('sessions.description')}
      action={
        total > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setConfirming(true);
            }}
          >
            {t('sessions.endOthers')}
          </Button>
        )
      }
    >
      {sessions.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void sessions.refetch()}>
              {t('sessions.retry')}
            </Button>
          }
        >
          {t('sessions.error')}
        </Alert>
      ) : sessions.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {failure && <Alert severity="error">{t(`errors:${failure.code}`)}</Alert>}
          {sessions.data.current && (
            <ul className="m-0 list-none p-0">
              <SessionRow session={sessions.data.current} current ending={false} />
            </ul>
          )}
          <div className="flex flex-col gap-2">
            <Typography variant="overline" component="h3" color="textSecondary">
              {t('sessions.others', { count: total })}
            </Typography>
            {total === 0 ? (
              <Typography variant="body2" color="textSecondary">
                {t('sessions.onlyThis')}
              </Typography>
            ) : (
              <ul
                aria-busy={sessions.isPlaceholderData}
                className={
                  sessions.isPlaceholderData ? 'm-0 list-none p-0 opacity-60' : 'm-0 list-none p-0'
                }
              >
                {others?.content.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    current={false}
                    ending={endOne.isPending && endOne.variables === session.id}
                    onEnd={() => {
                      endOne.mutate(session.id);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
          {pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-3">
              <Typography variant="caption" color="textSecondary" className="app-tabular">
                {t('sessions.range', { from: number(from), to: number(to), count: number(total) })}
              </Typography>
              <Pagination
                shape="rounded"
                color="primary"
                count={pages}
                page={Math.min(page + 1, pages)}
                siblingCount={0}
                aria-label={t('sessions.pages')}
                onChange={(_event, value) => {
                  goTo(value - 1);
                }}
              />
            </div>
          )}
        </div>
      )}
      <Dialog
        open={confirming}
        onClose={() => {
          if (!endOthers.isPending) {
            setConfirming(false);
          }
        }}
        maxWidth="xs"
        fullWidth
        aria-labelledby={titleId}
      >
        <DialogTitle id={titleId}>{t('sessions.confirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('sessions.confirmText', { count: total })}</DialogContentText>
        </DialogContent>
        <DialogActions className="px-4 py-3 sm:px-6">
          <Button
            ref={keepRef}
            onClick={() => {
              setConfirming(false);
            }}
            disabled={endOthers.isPending}
          >
            {t('sessions.keep')}
          </Button>
          <Button
            variant="contained"
            color="error"
            loading={endOthers.isPending}
            onClick={() => {
              endOthers.mutate(undefined, {
                onSuccess: () => {
                  setConfirming(false);
                  goTo(0);
                },
              });
            }}
          >
            {t('sessions.confirm', { count: total })}
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsCard>
  );
}
