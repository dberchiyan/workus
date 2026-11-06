import AddOutlined from '@mui/icons-material/AddOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOwnBalances, useOwnRequests } from '../hooks/useTimeOffQueries';
import type { TimeOffRequest } from '../types';
import { CancelRequestDialog } from './CancelRequestDialog';
import { CreateRequestDialog } from './CreateRequestDialog';
import { LeaveBalanceCards } from './LeaveBalanceCards';
import { RequestCardList } from './RequestCardList';
import { RequestsTable } from './RequestsTable';

type Notice = 'created' | 'canceled';

/** The signed-in employee's balances and requests (dashboard). */
export function MyTimeOff() {
  const { t, i18n } = useTranslation('timeOff');
  const balances = useOwnBalances();
  const requests = useOwnRequests();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creation, setCreation] = useState(0);
  const [canceling, setCanceling] = useState<{ request: TimeOffRequest; open: boolean } | null>(
    null,
  );
  const startCancel = (request: TimeOffRequest): void => {
    setCanceling({ request, open: true });
  };
  const closeCancel = (): void => {
    setCanceling((current) => (current ? { ...current, open: false } : null));
  };
  const [notice, setNotice] = useState<Notice | null>(null);
  const createRef = useRef<HTMLButtonElement>(null);
  const requestsHeadingRef = useRef<HTMLHeadingElement>(null);

  const items = requests.data?.pages.flatMap((page) => page.content) ?? [];
  const total = requests.data?.pages[0]?.totalElements ?? 0;
  const toggle = (requestId: string): void => {
    setExpandedId((current) => (current === requestId ? null : requestId));
  };
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="time-off-balances" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Typography id="time-off-balances" variant="h5" component="h2">
            {t('balances.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('balances.subtitle')}
          </Typography>
        </div>
        <LeaveBalanceCards
          data={balances.data}
          isPending={balances.isPending}
          isError={balances.isError}
          onRetry={() => void balances.refetch()}
          headingLevel="h3"
          layout="row"
        />
      </section>

      <Card variant="outlined" component="section" aria-labelledby="time-off-requests">
        <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <Typography
              ref={requestsHeadingRef}
              id="time-off-requests"
              tabIndex={-1}
              variant="h5"
              component="h2"
              className="outline-none"
            >
              {t('requests.title')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {t('requests.subtitle')}
            </Typography>
          </div>
          <Button
            ref={createRef}
            variant="contained"
            startIcon={<AddOutlined aria-hidden />}
            disabled={!balances.data}
            onClick={() => {
              setCreation((count) => count + 1);
              setIsCreating(true);
            }}
          >
            {t('requests.create')}
          </Button>
        </div>

        {requests.isPending ? (
          <div className="flex flex-col gap-2 px-4 pb-4 sm:px-6" aria-busy="true">
            <span className="sr-only">{t('requests.loading')}</span>
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} variant="rounded" className="h-12" />
            ))}
          </div>
        ) : !requests.data ? (
          <div className="px-4 pb-4 sm:px-6">
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => void requests.refetch()}>
                  {t('requests.retry')}
                </Button>
              }
            >
              {t('requests.error')}
            </Alert>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t border-divider px-6 py-12 text-center">
            <span
              aria-hidden
              className="flex size-14 items-center justify-center rounded-lg bg-badge-active-background text-badge-active-text"
            >
              <EventNoteOutlined />
            </span>
            <Typography variant="subtitle1" component="p">
              {t('requests.empty')}
            </Typography>
            <Typography variant="body2" color="textSecondary" className="max-w-md">
              {t('requests.emptyHint')}
            </Typography>
          </div>
        ) : (
          // The card's own width decides (container query): table when it fits, else stacked.
          <div className="@container border-t border-divider">
            <div className="hidden @[48rem]:block">
              <RequestsTable
                requests={items}
                expandedId={expandedId}
                onToggle={toggle}
                onCancel={startCancel}
              />
            </div>
            <div className="@[48rem]:hidden">
              <RequestCardList
                requests={items}
                expandedId={expandedId}
                onToggle={toggle}
                onCancel={startCancel}
              />
            </div>
          </div>
        )}

        {requests.data && items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider px-4 py-3 sm:px-6">
            <Typography variant="caption" color="textSecondary" role="status" aria-live="polite">
              {requests.hasNextPage
                ? t('requests.shown', { shown: number(items.length), total: number(total) })
                : t('requests.end')}
            </Typography>
            {requests.hasNextPage && (
              <Button
                onClick={() => void requests.fetchNextPage()}
                disabled={requests.isFetchingNextPage}
                aria-busy={requests.isFetchingNextPage}
              >
                {requests.isFetchingNextPage ? t('requests.loadingMore') : t('requests.loadMore')}
              </Button>
            )}
          </div>
        )}
      </Card>

      {balances.data && (
        <CreateRequestDialog
          key={creation}
          open={isCreating}
          balances={balances.data.content}
          onClose={() => {
            setIsCreating(false);
          }}
          onCreated={() => {
            setIsCreating(false);
            setNotice('created');
          }}
          onExited={() => {
            createRef.current?.focus();
          }}
        />
      )}
      <CancelRequestDialog
        key={canceling?.request.id ?? 'none'}
        request={canceling?.request ?? null}
        open={canceling?.open ?? false}
        onClose={closeCancel}
        onCanceled={() => {
          closeCancel();
          setNotice('canceled');
        }}
        onExited={() => {
          setCanceling(null);
          requestsHeadingRef.current?.focus();
        }}
      />
      {/* Polite status; stays until dismissed or replaced. */}
      <Snackbar
        open={notice !== null}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') {
            setNotice(null);
          }
        }}
        message={notice ? t(`notice.${notice}`) : ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </div>
  );
}
