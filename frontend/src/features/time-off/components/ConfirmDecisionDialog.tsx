import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ErrorCode } from '@/shared/types';
import { formatPeriod, fullName } from '../format';
import { RESERVED_LINE } from '../hooks/useFieldMessage';
import type { ManagedRequest } from '../types';

export interface ConfirmDecisionDialogProps {
  /** Kept while the dialog closes, so its text does not vanish mid-transition. */
  target: { request: ManagedRequest; decision: 'reject' | 'cancel' } | null;
  open: boolean;
  busy: boolean;
  errorCode: ErrorCode | null;
  onConfirm: () => void;
  onClose: () => void;
  onExited: () => void;
}

/** Reject or cancel: names the request and the consequence; "Keep it" has the initial focus. */
export function ConfirmDecisionDialog({
  target,
  open,
  busy,
  errorCode,
  onConfirm,
  onClose,
  onExited,
}: ConfirmDecisionDialogProps) {
  const { t, i18n } = useTranslation(['timeOff', 'errors']);
  const titleId = useId();
  const descriptionId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        keepRef.current?.focus();
      });
    }
  }, [open]);

  const decision = target?.decision ?? 'reject';
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) {
          onClose();
        }
      }}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t(`manage.confirm.${decision}.title`)}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId}>
          {target &&
            t(`manage.confirm.${decision}.description`, {
              name: fullName(target.request.employee),
              type: t(`types.${target.request.type}`),
              period: formatPeriod(target.request.startDate, target.request.endDate, i18n.language),
            })}
        </DialogContentText>
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
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? t('manage.confirm.working') : t(`manage.confirm.${decision}.confirm`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
