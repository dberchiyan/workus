import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { ClosedRequests } from '../components/ClosedRequests';
import { ConfirmDecisionDialog } from '../components/ConfirmDecisionDialog';
import { PendingRequests } from '../components/PendingRequests';
import { RequestDialog } from '../components/RequestDialog';
import { RequestsFilters } from '../components/RequestsFilters';
import { formatPeriod, fullName } from '../format';
import { useRequestDecisions } from '../hooks/useRequestDecisions';
import { useRequestsParams } from '../hooks/useRequestsParams';

/** Every employee's time-off requests (admin): what waits for a decision, then the rest. */
export default function RequestsPage() {
  const { t, i18n } = useTranslation(['timeOff', 'errors']);
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

  const notice = decisions.notice;
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
      <ConfirmDecisionDialog
        // A new request or decision starts with an empty reason.
        key={
          decisions.confirming
            ? `${decisions.confirming.request.id}-${decisions.confirming.decision}`
            : 'none'
        }
        target={decisions.confirming}
        open={decisions.confirming?.open ?? false}
        busy={decisions.isPending}
        errorCode={decisions.confirmError}
        onConfirm={decisions.confirm}
        onClose={decisions.closeConfirm}
        onExited={decisions.clearConfirm}
      />
      {/* Polite status; stays until dismissed or replaced. */}
      <Snackbar
        open={notice !== null || decisions.failure !== null}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') {
            decisions.dismiss();
          }
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={decisions.failure ? 'error' : 'success'}
          variant="filled"
          onClose={decisions.dismiss}
          role={decisions.failure ? 'alert' : 'status'}
        >
          {decisions.failure
            ? t(`errors:${decisions.failure}`)
            : notice &&
              t(`manage.notice.${notice.decision}`, {
                name: fullName(notice.request.employee),
                type: t(`types.${notice.request.type}`),
                period: formatPeriod(
                  notice.request.startDate,
                  notice.request.endDate,
                  i18n.language,
                ),
              })}
        </Alert>
      </Snackbar>
    </div>
  );
}
