import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { ErrorCode } from '@/shared/types';
import { formatPeriod, fullName } from '../format';
import { RESERVED_LINE } from '../hooks/useFieldMessage';
import type { ManagedRequest } from '../types';
import { TYPE_VISUALS } from './timeOffVisuals';

/** Mirrors the backend (decision_comment VARCHAR(500)). */
const REASON_MAX = 500;

export interface ConfirmDecisionDialogProps {
  /** Kept while the dialog closes, so its text does not vanish mid-transition. */
  target: { request: ManagedRequest; decision: 'reject' | 'cancel' } | null;
  open: boolean;
  busy: boolean;
  errorCode: ErrorCode | null;
  /** `comment`: the reason given for a rejection, if any. */
  onConfirm: (comment?: string) => void;
  onClose: () => void;
  onExited: () => void;
}

/**
 * Reject or cancel: names the request and the consequence; "Keep it" has the initial focus. A
 * rejection shows the request and takes an optional reason the employee will see. The parent
 * remounts it per request (`key`), so the reason starts empty.
 */
export function ConfirmDecisionDialog({
  target,
  open,
  busy,
  errorCode,
  onConfirm,
  onClose,
  onExited,
}: ConfirmDecisionDialogProps) {
  const { t, i18n } = useTranslation(['timeOff', 'errors', 'validation']);
  const titleId = useId();
  const descriptionId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        keepRef.current?.focus();
      });
    }
  }, [open]);

  const decision = target?.decision ?? 'reject';
  const request = target?.request;
  const tooLong = reason.trim().length > REASON_MAX;
  const visuals = request ? TYPE_VISUALS[request.type] : null;

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) {
          onClose();
        }
      }}
      maxWidth={decision === 'reject' ? 'sm' : 'xs'}
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t(`manage.confirm.${decision}.title`)}</DialogTitle>
      <DialogContent className="flex flex-col gap-4">
        <DialogContentText id={descriptionId}>
          {request &&
            t(`manage.confirm.${decision}.description`, {
              name: fullName(request.employee),
              type: t(`types.${request.type}`),
              period: formatPeriod(request.startDate, request.endDate, i18n.language),
            })}
        </DialogContentText>
        {decision === 'reject' && request && visuals && (
          <>
            <div className="flex items-center gap-3 rounded-md bg-background p-3">
              <span
                aria-hidden
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-md text-avatar-text',
                  visuals.tone,
                )}
              >
                <visuals.icon fontSize="small" />
              </span>
              <span className="flex min-w-0 flex-col">
                <Typography variant="subtitle2" component="span">
                  {t(`types.${request.type}`)} · {t('requests.days', { count: request.days })}
                </Typography>
                <Typography variant="body2" color="textSecondary" className="app-tabular">
                  {formatPeriod(request.startDate, request.endDate, i18n.language)}
                </Typography>
              </span>
            </div>
            {request.note && (
              <Typography
                variant="body2"
                color="textSecondary"
                className="border-l-2 border-divider pl-3 [overflow-wrap:anywhere]"
              >
                {request.note}
              </Typography>
            )}
            <TextField
              label={t('manage.confirm.reject.reason')}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
              }}
              multiline
              minRows={3}
              error={tooLong}
              helperText={
                tooLong
                  ? t('validation:decisionComment.tooLong', { max: REASON_MAX })
                  : t('manage.confirm.reject.reasonHint', {
                      count: reason.trim().length,
                      max: REASON_MAX,
                    })
              }
              slotProps={{ htmlInput: { maxLength: REASON_MAX + 50 } }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions className="flex-wrap gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <FormHelperText
          component="div"
          role="alert"
          error
          className="m-0 basis-full sm:mr-auto sm:basis-auto"
        >
          {errorCode ? t(`errors:${errorCode}`) : RESERVED_LINE}
        </FormHelperText>
        <Button ref={keepRef} onClick={onClose} disabled={busy}>
          {t('manage.confirm.keep')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            onConfirm(decision === 'reject' ? reason.trim() || undefined : undefined);
          }}
          disabled={busy || tooLong}
          aria-busy={busy}
        >
          {busy ? t('manage.confirm.working') : t(`manage.confirm.${decision}.confirm`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
