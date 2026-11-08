import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { useDecideCompany } from '../hooks/usePlatform';
import type { Company } from '../types';

const RESERVED_LINE = ' ';
const REASON_MAX = 500;

export interface DecideCompanyDialogProps {
  company: Company;
  decision: 'approve' | 'reject';
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

/**
 * Approve (its people can start at once) or reject with a reason its owner will read. Cancel has
 * the first focus; the reason is required and checked on submit.
 */
export function DecideCompanyDialog({
  company,
  decision,
  open,
  onClose,
  onExited,
}: DecideCompanyDialogProps) {
  const { t } = useTranslation(['platform', 'errors']);
  const titleId = useId();
  const textId = useId();
  const decide = useDecideCompany(company.id);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  const isReject = decision === 'reject';

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  const confirm = async (): Promise<void> => {
    setErrorCode(null);
    const trimmed = reason.trim();
    if (isReject && trimmed === '') {
      setReasonError(t('decide.reasonRequired'));
      reasonRef.current?.focus();
      return;
    }
    setReasonError(null);
    try {
      await decide.mutateAsync(isReject ? { decision, reason: trimmed } : { decision });
      onClose();
    } catch (caught) {
      if (!isApiError(caught)) {
        throw caught;
      }
      const detail = caught.details.find((item) => item.field === 'reason');
      if (detail) {
        setReasonError(detail.message);
      } else {
        setErrorCode(caught.code);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={decide.isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={textId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>
        {t(isReject ? 'decide.rejectTitle' : 'decide.approveTitle', { company: company.name })}
      </DialogTitle>
      <DialogContent className="flex flex-col gap-3">
        <DialogContentText id={textId}>
          {t(isReject ? 'decide.rejectText' : 'decide.approveText')}
        </DialogContentText>
        {isReject && (
          <TextField
            inputRef={reasonRef}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            label={t('decide.reason')}
            required
            multiline
            minRows={3}
            error={reasonError !== null}
            helperText={reasonError ?? t('decide.reasonHint')}
            slotProps={{ htmlInput: { maxLength: REASON_MAX } }}
          />
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
        <Button ref={cancelRef} onClick={onClose} disabled={decide.isPending}>
          {t('decide.cancel')}
        </Button>
        <Button
          variant="contained"
          color={isReject ? 'error' : 'primary'}
          loading={decide.isPending}
          onClick={() => void confirm()}
        >
          {t(isReject ? 'decide.reject' : 'decide.approve')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
