import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { ClosedRequests } from '../components/ClosedRequests';
import { DecisionFeedback } from '../components/DecisionFeedback';
import { PendingRequests } from '../components/PendingRequests';
import { RequestDialog } from '../components/RequestDialog';
import { RequestsFilters } from '../components/RequestsFilters';
import { useRequestDecisions } from '../hooks/useRequestDecisions';
import { useRequestsParams } from '../hooks/useRequestsParams';

/** Every employee's time-off requests (admin): what waits for a decision, then the rest. */
export default function RequestsPage() {
  const { t } = useTranslation('timeOff');
  useDocumentTitle(t('manage.pageTitle'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  const { data: user } = useCurrentUser();
  const { params, update } = useRequestsParams();
  const decisions = useRequestDecisions();
  // One clock reading per visit: "waiting N days" must not change between renders.
  const [now] = useState(() => Date.now());
  const onSearch = useCallback(
    (search: string) => {
      update({ search });
    },
    [update],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Typography
            ref={headingRef}
            tabIndex={-1}
            variant="h4"
            component="h1"
            className="outline-none"
          >
            {t('manage.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('manage.subtitle')}
          </Typography>
        </div>
        <RequestsFilters
          search={params.search}
          type={params.type}
          mine={params.mine}
          onSearch={onSearch}
          onType={(type) => {
            update({ type });
          }}
          onMine={(mine) => {
            update({ mine });
          }}
        />
      </div>
      <PendingRequests
        params={params}
        now={now}
        busyId={decisions.busyId}
        onDecide={decisions.start}
      />
      <ClosedRequests
        params={params}
        onStatus={(status) => {
          update({ status });
        }}
        onPage={(page, size) => {
          update({ page, size });
        }}
      />

      {params.request && user && (
        <RequestDialog
          key={params.request}
          requestId={params.request}
          open
          viewerId={user.id}
          busy={decisions.isPending}
          onDecide={decisions.start}
          onClose={() => {
            update({ request: undefined });
          }}
        />
      )}
      <DecisionFeedback decisions={decisions} />
    </div>
  );
}
