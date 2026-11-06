import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { formatCalendarDate, todayIso } from '../format';
import { RESERVED_LINE, useFieldMessage } from '../hooks/useFieldMessage';
import { useTerminateForm } from '../hooks/useTerminateForm';
import { TERMINATION_COMMENT_MAX, TERMINATION_REASONS } from '../schemas';
import type { EmployeeProfile } from '../types';

export interface TerminateDialogProps {
  employee: EmployeeProfile;
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

/**
 * Terminate from a date (today, past or future) with a reason; or change the termination. Says
 * what happens before the confirm button, which names the person (data.md → irreversible forms).
 */
export function TerminateDialog({ employee, open, onClose, onExited }: TerminateDialogProps) {
  const { t, i18n } = useTranslation(['employee', 'errors']);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const message = useFieldMessage();
  const { form, submit, errorCode, errorRef, isSubmitting } = useTerminateForm(employee, onClose);
  const { register, control, formState, watch } = form;
  const { errors } = formState;
  const isChange = employee.termination !== null;
  const name = `${employee.firstName} ${employee.lastName}`;
  const [date, reason] = watch(['date', 'reason']);
  const isFuture = /^\d{4}-\d{2}-\d{2}$/.test(date) && date > todayIso();

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
      fullScreen={isPhone}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      slotProps={{ transition: { onExited } }}
    >
      <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void submit(e)}>
        <DialogTitle id={titleId}>
          {isChange ? t('terminate.changeTitle', { name }) : t('terminate.title', { name })}
        </DialogTitle>
        <DialogContent dividers className="flex flex-col gap-2">
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <TextField
              {...register('date')}
              type="date"
              required
              label={t('terminate.fields.date')}
              error={Boolean(errors.date)}
              helperText={message(errors.date)}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: employee.startDate },
              }}
            />
            <Controller
              control={control}
              name="reason"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  required
                  label={t('terminate.fields.reason')}
                  error={Boolean(fieldState.error)}
                  helperText={message(fieldState.error)}
                >
                  {TERMINATION_REASONS.map((value) => (
                    <MenuItem key={value} value={value}>
                      {t(`termination.reasons.${value}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              {...register('comment')}
              multiline
              minRows={3}
              required={reason === 'OTHER'}
              label={t('terminate.fields.comment')}
              error={Boolean(errors.comment)}
              helperText={message(errors.comment, TERMINATION_COMMENT_MAX)}
              className="sm:col-span-2"
              slotProps={{ htmlInput: { maxLength: TERMINATION_COMMENT_MAX } }}
            />
          </div>
          {/* What will happen, before the confirm button. */}
          <Alert severity="warning" variant="outlined">
            {isFuture
              ? t('terminate.consequence.future', {
                  name: employee.firstName,
                  date: formatCalendarDate(date, i18n.language),
                })
              : t('terminate.consequence.now', { name: employee.firstName })}{' '}
            {t('terminate.consequence.reviews')}
          </Alert>
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
            {t('terminate.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? t('terminate.saving')
              : isChange
                ? t('terminate.saveChange')
                : t('terminate.submit', { name })}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
