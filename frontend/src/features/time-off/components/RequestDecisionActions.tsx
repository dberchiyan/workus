import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { ManagedRequest, TimeOffDecision } from '../types';

export interface RequestDecisionActionsProps {
  request: ManagedRequest;
  busy: boolean;
  onDecide: (request: ManagedRequest, decision: TimeOffDecision) => void;
}

/** Cancel apart on the left; reject and approve on the right; otherwise why nothing can be done. */
export function RequestDecisionActions({ request, busy, onDecide }: RequestDecisionActionsProps) {
  const { t } = useTranslation('timeOff');
  const { can } = request;
  return (
    <DialogActions className="flex-wrap gap-2 px-4 py-3 sm:px-6 sm:py-4">
      {can.cancel && (
        <Button
          color="error"
          disabled={busy}
          className="sm:mr-auto"
          onClick={() => {
            onDecide(request, 'cancel');
          }}
        >
          {t('manage.cancel')}
        </Button>
      )}
      {!can.approve && !can.cancel && (
        <Typography variant="body2" color="textSecondary" className="mr-auto">
          {request.status === 'PENDING' ? t('manage.dialog.notYours') : t('manage.dialog.closed')}
        </Typography>
      )}
      {can.reject && (
        <Button
          variant="outlined"
          color="error"
          disabled={busy}
          onClick={() => {
            onDecide(request, 'reject');
          }}
        >
          {t('manage.reject')}
        </Button>
      )}
      {can.approve && (
        <Button
          variant="contained"
          disabled={busy}
          aria-busy={busy}
          onClick={() => {
            onDecide(request, 'approve');
          }}
        >
          {t('manage.approve')}
        </Button>
      )}
    </DialogActions>
  );
}
