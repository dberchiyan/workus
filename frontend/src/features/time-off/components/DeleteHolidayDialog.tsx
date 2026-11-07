import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { formatDay } from '../format';
import { RESERVED_LINE } from '../hooks/useFieldMessage';
import { useDeleteHoliday } from '../hooks/useHolidays';
import type { Holiday } from '../types';

export interface DeleteHolidayDialogProps {
  holiday: Holiday;
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

/** Says what changes (requests on that day take it again); Cancel has the first focus. */
export function DeleteHolidayDialog({
  holiday,
  open,
  onClose,
  onExited,
}: DeleteHolidayDialogProps) {
  const { t, i18n } = useTranslation(['timeOff', 'errors']);
  const titleId = useId();
  const descriptionId = useId();
  const remove = useDeleteHoliday();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  const confirm = async (): Promise<void> => {
    setErrorCode(null);
    try {
      await remove.mutateAsync(holiday.id);
      onClose();
    } catch (error) {
      setErrorCode(isApiError(error) ? error.code : 'INTERNAL_ERROR');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={remove.isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t('holidays.delete.title')}</DialogTitle>
      <DialogContent id={descriptionId} className="flex flex-col gap-2">
        <Typography variant="body1" className="[overflow-wrap:anywhere]">
          {t('holidays.delete.body', {
            name: holiday.name,
            date: formatDay(holiday.date, i18n.language),
          })}
        </Typography>
        {holiday.recurring && holiday.carriedOver && (
          <Typography variant="body2" color="textSecondary">
            {t('holidays.delete.copyStays')}
          </Typography>
        )}
        <FormHelperText component="div" role="alert" error className="m-0">
          {errorCode ? t(`errors:${errorCode}`) : RESERVED_LINE}
        </FormHelperText>
      </DialogContent>
      <DialogActions className="px-4 py-3 sm:px-6 sm:py-4">
        <Button ref={cancelRef} onClick={onClose} disabled={remove.isPending}>
          {t('holidays.delete.keep')}
        </Button>
        <Button
          variant="contained"
          color="error"
          loading={remove.isPending}
          onClick={() => void confirm()}
        >
          {t('holidays.delete.confirm', { name: holiday.name })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
