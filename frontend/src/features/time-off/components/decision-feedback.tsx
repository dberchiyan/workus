import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { formatPeriod, fullName } from '../format';
import type { useRequestDecisions } from '../hooks/use-request-decisions';
import { ConfirmDecisionDialog } from './confirm-decision-dialog';

export interface DecisionFeedbackProps {
    decisions: ReturnType<typeof useRequestDecisions>;
}

/** What follows a decision wherever it is made: the reject / cancel confirmation and the notice. */
export function DecisionFeedback({ decisions }: DecisionFeedbackProps): ReactElement {
    const { t, i18n } = useTranslation(['timeOff', 'errors']);
    const notice = decisions.notice;
    return (
        <>
            <ConfirmDecisionDialog
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
                              period: formatPeriod(notice.request.startsAt, notice.request.endsAt, i18n.language),
                          })}
                </Alert>
            </Snackbar>
        </>
    );
}
