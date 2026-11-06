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
import { formatCalendarDate } from '../format';
import { useCancelTermination } from '../hooks/useEmployeeQueries';
import { RESERVED_LINE } from '../hooks/useFieldMessage';
import type { EmployeeProfile } from '../types';

export interface CancelTerminationDialogProps {
  employee: EmployeeProfile;
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

/** Confirmation; Cancel has focus first. Reviews canceled by the termination stay canceled. */
export function CancelTerminationDialog({
  employee,
  open,
  onClose,
  onExited,
}: CancelTerminationDialogProps) {
  const { t, i18n } = useTranslation(['employee', 'errors']);
  const titleId = useId();
  const descriptionId = useId();
  const cancel = useCancelTermination(employee.id);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const isPending = cancel.isPending;
  const keepRef = useRef<HTMLButtonElement>(null);

  // Confirmation: the safe choice gets the initial focus.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        keepRef.current?.focus();
      });
    }
  }, [open]);

  useEffect(() => {
    if (errorCount > 0) {
      errorRef.current?.focus();
    }
  }, [errorCount]);

  const confirm = async (): Promise<void> => {
    setErrorCode(null);
    try {
      await cancel.mutateAsync(employee.version);
      onClose();
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      setErrorCode(error.code);
      setErrorCount((count) => count + 1);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isPending) {
          onClose();
        }
      }}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t('cancelTermination.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId}>
          {t('cancelTermination.description', {
            name: `${employee.firstName} ${employee.lastName}`,
            date: employee.terminatedOn
              ? formatCalendarDate(employee.terminatedOn, i18n.language)
              : '',
          })}
        </DialogContentText>
      </DialogContent>
      <DialogActions className="flex-wrap gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <FormHelperText
          component="div"
          role="alert"
          ref={errorRef}
          tabIndex={-1}
          error
          className="m-0 basis-full outline-none sm:mr-auto sm:basis-auto"
        >
          {errorCode ? t(`errors:${errorCode}`) : RESERVED_LINE}
        </FormHelperText>
        <Button ref={keepRef} onClick={onClose} disabled={isPending}>
          {t('cancelTermination.keep')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void confirm()}
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? t('cancelTermination.saving') : t('cancelTermination.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
