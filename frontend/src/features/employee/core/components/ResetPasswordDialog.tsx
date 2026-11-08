import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { useResetPassword } from '../hooks/useEmployeeQueries';
import { CredentialsCard } from '@/shared/components/CredentialsCard';
import { RESERVED_LINE } from '../hooks/useFieldMessage';
import type { EmployeeProfile } from '../types';

export interface ResetPasswordDialogProps {
  employee: EmployeeProfile;
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

/**
 * Confirm, then show the new password once. Confirming says what follows (the current password
 * stops working, the person is signed out everywhere) with Cancel focused first; the result step
 * closes only through Done, once the password was copied or marked as saved.
 */
export function ResetPasswordDialog({
  employee,
  open,
  onClose,
  onExited,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation(['employee', 'common', 'errors']);
  const titleId = useId();
  const descriptionId = useId();
  const doneHintId = useId();
  const theme = useTheme();
  // The password step is a full-screen sheet on phones, so the password stays on one line.
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const reset = useResetPassword(employee.id);
  // One key per opening: a retry of this reset never resets twice.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [password, setPassword] = useState<string | null | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const name = `${employee.firstName} ${employee.lastName}`;
  const isDone = password !== undefined;
  const canFinish = isSaved || password === null;

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);
  useEffect(() => {
    if (errorCode) {
      errorRef.current?.focus();
    }
  }, [errorCode]);

  const confirm = async (): Promise<void> => {
    setErrorCode(null);
    try {
      const result = await reset.mutateAsync(idempotencyKey);
      setPassword(result.temporaryPassword);
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      setErrorCode(error.code);
    }
  };

  const finish = (): void => {
    // The password leaves memory with the dialog.
    setPassword(undefined);
    reset.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      // The result step closes only through Done, so the password is not lost by accident.
      onClose={isDone || reset.isPending ? undefined : onClose}
      maxWidth={isDone ? 'sm' : 'xs'}
      fullWidth
      fullScreen={isDone && isPhone}
      aria-labelledby={titleId}
      aria-describedby={isDone ? undefined : descriptionId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t('resetPassword.title')}</DialogTitle>
      {isDone ? (
        <>
          <DialogContent dividers>
            <CredentialsCard
              name={name}
              email={employee.email}
              password={password}
              saved={canFinish}
              onSavedChange={setIsSaved}
              title={t('resetPassword.doneTitle', { name })}
              description={t('resetPassword.doneDescription', { name })}
            />
          </DialogContent>
          <DialogActions className="flex-wrap gap-2 px-4 py-3 sm:px-6 sm:py-4">
            <FormHelperText id={doneHintId} className="m-0 basis-full sm:mr-auto sm:basis-auto">
              {canFinish ? RESERVED_LINE : t('common:credentials.doneHint')}
            </FormHelperText>
            <Button
              variant="contained"
              disabled={!canFinish}
              aria-describedby={doneHintId}
              onClick={finish}
            >
              {t('common:credentials.done')}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent>
            <DialogContentText id={descriptionId}>
              {t('resetPassword.description', { name })}
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
            <Button ref={cancelRef} onClick={onClose} disabled={reset.isPending}>
              {t('resetPassword.cancel')}
            </Button>
            <Button variant="contained" onClick={() => void confirm()} loading={reset.isPending}>
              {t('resetPassword.confirm')}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
