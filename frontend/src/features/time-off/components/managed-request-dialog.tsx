import type { ReactElement } from 'react';

import { useCurrentUser } from '@/features/auth';

import { useRequestDecisions } from '../hooks/use-request-decisions';
import { DecisionFeedback } from './decision-feedback';
import { RequestDialog } from './request-dialog';

export interface ManagedRequestDialogProps {
    requestId: string | undefined;
    onClose: () => void;
}

/**
 * A request opened in place — on the Calendar or the Dashboard — with its decisions. Stays
 * mounted while closed, so the confirmation and the notice outlive the dialog.
 */
export function ManagedRequestDialog({ requestId, onClose }: ManagedRequestDialogProps): ReactElement {
    const { data: user } = useCurrentUser();
    const decisions = useRequestDecisions();
    return (
        <>
            {requestId && user && (
                <RequestDialog
                    key={requestId}
                    requestId={requestId}
                    open
                    viewerId={user.id}
                    busy={decisions.isPending}
                    onDecide={decisions.start}
                    onClose={onClose}
                />
            )}
            <DecisionFeedback decisions={decisions} />
        </>
    );
}
