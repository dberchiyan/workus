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
import { RESERVED_LINE } from '../hooks/useFieldMessage';

export interface RemoveStructureItem {
  kind: 'department' | 'position';
  id: string;
  name: string;
}

export interface RemoveStructureItemDialogProps {
  item: RemoveStructureItem | null;
  open: boolean;
  busy: boolean;
  onConfirm: (item: RemoveStructureItem) => Promise<void>;
  onClose: () => void;
  onExited: () => void;
}

/** Removing a department or a position: Cancel has the focus first; the name is said. */
export function RemoveStructureItemDialog({
  item,
  open,
  busy,
  onConfirm,
  onClose,
  onExited,
}: RemoveStructureItemDialogProps) {
  const { t } = useTranslation(['employee', 'errors']);
  const titleId = useId();
  const descriptionId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [errorCount, setErrorCount] = useState(0);

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
    if (!item) {
      return;
    }
    setErrorCode(null);
    try {
      await onConfirm(item);
      onClose();
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      setErrorCode(error.code);
      setErrorCount((count) => count + 1);
    }
  };

  const kind = item?.kind ?? 'position';
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
      <DialogTitle id={titleId}>{t(`structure.remove.${kind}.title`)}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId}>
          {t(`structure.remove.${kind}.description`, { name: item?.name ?? '' })}
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
        <Button ref={keepRef} onClick={onClose} disabled={busy}>
          {t('structure.remove.keep')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => void confirm()}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? t('structure.remove.removing') : t('structure.remove.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
