import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCount } from '../format';
import { useManagedRequests } from '../hooks/useManagedRequests';
import type { RequestsParams } from '../hooks/useRequestsParams';
import type { ManagedRequest, TimeOffDecision } from '../types';
import { PendingRequestCard } from './PendingRequestCard';
import { SectionHeader } from './SectionHeader';

/** Cards shown at first and added by "Show more"; the API allows up to 100 per page. */
const STEP = 12;
const MAX = 96;

export interface PendingRequestsProps {
  params: RequestsParams;
  now: number;
  busyId: string | null;
  onDecide: (request: ManagedRequest, decision: TimeOffDecision) => void;
}

/** Requests waiting for a decision, the longest waiting first. */
export function PendingRequests({ params, now, busyId, onDecide }: PendingRequestsProps) {
  const { t, i18n } = useTranslation('timeOff');
  const [size, setSize] = useState(STEP);
  const requests = useManagedRequests({
    state: 'PENDING',
    type: params.type,
    status: undefined,
    mine: params.mine,
    search: params.search,
    page: 0,
    size,
  });
  const items = requests.data?.content ?? [];
  const total = requests.data?.totalElements;

  return (
    <section aria-labelledby="requests-pending" className="flex flex-col gap-4">
      <SectionHeader
        id="requests-pending"
        title={t('manage.pending.title')}
        subtitle={t('manage.pending.subtitle')}
        count={total === undefined ? undefined : formatCount(total, i18n.language)}
      />
      {requests.isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          <span className="sr-only">{t('manage.loading')}</span>
          {[0, 1, 2].map((card) => (
            <Skeleton key={card} variant="rounded" className="h-56" />
          ))}
        </div>
      ) : requests.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void requests.refetch()}>
              {t('requests.retry')}
            </Button>
          }
        >
          {t('manage.error')}
        </Alert>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-divider px-6 py-10 text-center">
          <TaskAltOutlined aria-hidden className="text-success" fontSize="large" />
          <Typography variant="subtitle1" component="p">
            {t('manage.pending.empty')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('manage.pending.emptyHint')}
          </Typography>
        </div>
      ) : (
        <>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
            {items.map((request) => (
              <li key={request.id}>
                <PendingRequestCard
                  request={request}
                  now={now}
                  busy={busyId === request.id}
                  onDecide={onDecide}
                />
              </li>
            ))}
          </ul>
          {total !== undefined && total > items.length && size < MAX && (
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setSize((current) => Math.min(current + STEP, MAX));
                }}
                disabled={requests.isFetching}
                aria-busy={requests.isFetching}
              >
                {t('manage.pending.more', {
                  shown: formatCount(items.length, i18n.language),
                  total: formatCount(total, i18n.language),
                })}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
