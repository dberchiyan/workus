import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '@/features/auth';
import { useDocumentTitle } from '@/shared/hooks/use-document-title';
import { usePageHeadingFocus } from '@/shared/hooks/use-page-heading-focus';

import { ClosedRequests } from '../components/closed-requests';
import { DecisionFeedback } from '../components/decision-feedback';
import { PendingRequests } from '../components/pending-requests';
import { RequestDialog } from '../components/request-dialog';
import { RequestsFilters } from '../components/requests-filters';
import { useRequestDecisions } from '../hooks/use-request-decisions';
import { useRequestsParams } from '../hooks/use-requests-params';

/** Every employee's time-off requests (admin): what waits for a decision, then the rest. */
export function RequestsPage(): ReactElement {
    const { t } = useTranslation('timeOff');
    useDocumentTitle(t('manage.pageTitle'));
    const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
    const { data: user } = useCurrentUser();
    const { params, update } = useRequestsParams();
    const decisions = useRequestDecisions();
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
                    <Typography ref={headingRef} tabIndex={-1} variant="h4" component="h1" className="outline-none">
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
            <PendingRequests params={params} now={now} busyId={decisions.busyId} onDecide={decisions.start} />
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
