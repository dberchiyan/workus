import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { formatPeriod } from '../format';
import { RESERVED_LINE } from '../hooks/useFieldMessage';
import { useCancelTimeOffRequest } from '../hooks/useTimeOffQueries';
import type { TimeOffRequest } from '../types';

export interface CancelRequestDialogProps {
  /** Kept while the dialog closes, so its text does not vanish mid-transition. */
  request: TimeOffRequest | null;
  open: boolean;
  onClose: () => void;
  onCanceled: () => void;
  onExited: () => void;
}

/** Irreversible confirmation: names the request; "Keep it" has the initial focus. */
export function CancelRequestDialog({
  request,
  open,
  onClose,
  onCanceled,
  onExited,
}: CancelRequestDialogProps) {
  const { t, i18n } = useTranslation(['timeOff', 'errors']);
  const titleId = useId();
  const descriptionId = useId();
  const cancel = useCancelTimeOffRequest();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        keepRef.current?.focus();
      });
    }
  }, [open]);

  const confirm = async (): Promise<void> => {
    if (!request) {
      return;
    }
    setErrorCode(null);
    try {
      await cancel.mutateAsync(request.id);
      onCanceled();
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      setErrorCode(error.code);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!cancel.isPending) {
          onClose();
        }
      }}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t('cancel.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId}>
          {request &&
            t('cancel.description', {
              type: t(`types.${request.type}`),
              period: formatPeriod(request.startDate, request.endDate, i18n.language),
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
        <Button ref={keepRef} onClick={onClose} disabled={cancel.isPending}>
          {t('cancel.keep')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => void confirm()}
          disabled={cancel.isPending}
          aria-busy={cancel.isPending}
        >
          {cancel.isPending ? t('cancel.canceling') : t('cancel.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
