import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import { useChangeRole } from '../hooks/useOrganisation';
import { NEXT_ROLE } from '../roles';
import type { Administrator } from '../types';

export interface ChangeRoleDialogProps {
  open: boolean;
  administrator: Administrator;
  /** The signed-in owner changes their own role. */
  isSelf: boolean;
  onClose: () => void;
  onExited: () => void;
}

/**
 * Confirms making an admin an owner or an owner an admin, saying what follows: the person is
 * signed out everywhere (their rights are re-read at the next sign-in) — or, for oneself, stays
 * signed in here with the new rights. Cancel takes focus first.
 */
export function ChangeRoleDialog({
  open,
  administrator,
  isSelf,
  onClose,
  onExited,
}: ChangeRoleDialogProps) {
  const { t } = useTranslation(['organisation', 'errors']);
  const changeRole = useChangeRole();
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const textId = useId();
  const nextRole = NEXT_ROLE[administrator.role];
  const name = `${administrator.firstName} ${administrator.lastName}`;
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  const confirm = async (): Promise<void> => {
    setError(null);
    try {
      await changeRole.mutateAsync({
        userId: administrator.id,
        request: { role: nextRole, version: administrator.version },
      });
      onClose();
    } catch (caught) {
      if (!isApiError(caught)) {
        throw caught;
      }
      setError(
        caught.code === 'BUSINESS_RULE_VIOLATION' ? caught.message : t(`errors:${caught.code}`),
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={textId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>
        {t(`settings.administrators.dialog.title.${nextRole}`, { name })}
      </DialogTitle>
      <DialogContent className="flex flex-col gap-3">
        <DialogContentText id={textId}>
          {t(`settings.administrators.dialog.text.${nextRole}`)}{' '}
          {isSelf
            ? t('settings.administrators.dialog.selfText')
            : t('settings.administrators.dialog.signedOutText', { name })}
        </DialogContentText>
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button ref={cancelRef} onClick={onClose}>
          {t('settings.administrators.dialog.cancel')}
        </Button>
        <Button variant="contained" loading={changeRole.isPending} onClick={() => void confirm()}>
          {t(`settings.administrators.make.${nextRole}`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
