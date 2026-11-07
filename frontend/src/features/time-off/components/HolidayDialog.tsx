import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import { useEffect, useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { RESERVED_LINE, useFieldMessage } from '../hooks/useFieldMessage';
import { useHolidayForm } from '../hooks/useHolidayForm';
import { TIME_OFF_LIMITS } from '../schemas';
import type { Holiday } from '../types';

export interface HolidayDialogProps {
  /** Undefined: a new holiday. */
  holiday: Holiday | undefined;
  /** The date a new holiday starts with (in the year shown). */
  defaultDate: string;
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

/** Add or change a holiday: date, name and whether it repeats every year. */
export function HolidayDialog({
  holiday,
  defaultDate,
  open,
  onClose,
  onExited,
}: HolidayDialogProps) {
  const { t } = useTranslation(['timeOff', 'errors']);
  const titleId = useId();
  const recurringHintId = useId();
  const message = useFieldMessage();
  const { form, submit, errorCode, errorRef, isSubmitting } = useHolidayForm(
    holiday,
    defaultDate,
    onClose,
  );
  const { errors } = form.formState;

  useEffect(() => {
    requestAnimationFrame(() => {
      form.setFocus('date');
    });
  }, [form]);

  const close = (): void => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      slotProps={{ transition: { onExited } }}
    >
      <form noValidate onSubmit={(event) => void submit(event)}>
        <DialogTitle id={titleId}>
          {holiday ? t('holidays.dialog.editTitle') : t('holidays.dialog.addTitle')}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-2">
          <TextField
            {...form.register('date')}
            type="date"
            required
            label={t('holidays.dialog.date')}
            error={Boolean(errors.date)}
            helperText={message(errors.date)}
            className="mt-2"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            {...form.register('name')}
            required
            label={t('holidays.dialog.name')}
            error={Boolean(errors.name)}
            helperText={message(errors.name, { max: TIME_OFF_LIMITS.holidayName })}
            slotProps={{ htmlInput: { maxLength: TIME_OFF_LIMITS.holidayName } }}
          />
          <Controller
            control={form.control}
            name="recurring"
            render={({ field }) => (
              <FormControlLabel
                className="m-0"
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(event) => {
                      field.onChange(event.target.checked);
                    }}
                    onBlur={field.onBlur}
                    slotProps={{
                      input: { ref: field.ref, 'aria-describedby': recurringHintId },
                    }}
                  />
                }
                label={t('holidays.dialog.recurring')}
              />
            )}
          />
          <FormHelperText id={recurringHintId} className="mx-0 mt-0">
            {t('holidays.dialog.recurringHint')}
          </FormHelperText>
          {holiday?.carriedOver && (
            <Alert severity="info" variant="outlined">
              {t('holidays.dialog.copyMade', { year: Number(holiday.date.slice(0, 4)) + 1 })}
            </Alert>
          )}
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
          <Button onClick={close} disabled={isSubmitting}>
            {t('holidays.dialog.cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {holiday ? t('holidays.dialog.save') : t('holidays.dialog.add')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
