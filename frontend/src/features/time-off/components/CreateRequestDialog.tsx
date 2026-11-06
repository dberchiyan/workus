import CloseOutlined from '@mui/icons-material/CloseOutlined';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { formatCount, formatDay, formatPeriod, workingDaysBetween } from '../format';
import { useCreateRequestForm } from '../hooks/useCreateRequestForm';
import { RESERVED_LINE, useFieldMessage } from '../hooks/useFieldMessage';
import { TIME_OFF_LIMITS } from '../schemas';
import type { LeaveBalance } from '../types';
import { RangeCalendar } from './RangeCalendar';
import { TypeOptions } from './TypeOptions';

export interface CreateRequestDialogProps {
  open: boolean;
  /** Current balances: the cycle and the days available for the chosen type. */
  balances: readonly LeaveBalance[];
  onClose: () => void;
  onCreated: () => void;
  onExited: () => void;
}

/**
 * Type (cards), date range (calendar) with the cycle and the days available, optional comment.
 * Says what the request takes before it is sent.
 */
export function CreateRequestDialog({
  open,
  balances,
  onClose,
  onCreated,
  onExited,
}: CreateRequestDialogProps) {
  const { t, i18n } = useTranslation(['timeOff', 'errors']);
  const locale = i18n.language;
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const rangeTitleId = useId();
  const message = useFieldMessage();
  const { form, submit, errorCode, errorRef, isSubmitting } = useCreateRequestForm(onCreated);
  const { register, control, formState, watch, setValue } = form;
  const { errors } = formState;
  const [type, startDate, endDate] = watch(['type', 'startDate', 'endDate']);
  const days = workingDaysBetween(startDate, endDate);
  const balance = balances.find((item) => item.type === type);
  const isOverBalance = balance?.available != null && days > balance.available;
  const rangeError = errors.startDate ?? errors.endDate;

  useEffect(() => {
    requestAnimationFrame(() => {
      form.setFocus('type');
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
      maxWidth="md"
      aria-labelledby={titleId}
      slotProps={{ transition: { onExited } }}
    >
      <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void submit(e)}>
        <DialogTitle id={titleId} className="flex items-center justify-between gap-2 pr-3">
          {t('create.title')}
          <IconButton aria-label={t('create.close')} onClick={close} disabled={isSubmitting}>
            <CloseOutlined aria-hidden />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="flex flex-col gap-6 bg-background">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
            {/* 16rem: one-off width of the type column, fits "Vacation days" with its icon. */}
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <TypeOptions
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  inputRef={field.ref}
                />
              )}
            />
            <section aria-labelledby={rangeTitleId} className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <Typography id={rangeTitleId} variant="subtitle1" component="h3">
                    {t('create.range')}
                  </Typography>
                  {balance && (
                    <Typography variant="body2" color="textSecondary" className="app-tabular">
                      {t('balances.cycle', {
                        start: formatDay(balance.cycleStart, locale),
                        end: formatDay(balance.cycleEnd, locale),
                      })}
                    </Typography>
                  )}
                </div>
                {balance && (
                  <div className="flex flex-col items-center gap-1 rounded-md border border-divider bg-background-paper px-4 py-2">
                    <Typography variant="overline" color="textSecondary">
                      {t('create.daysAvailable')}
                    </Typography>
                    <Typography variant="h5" component="p" color="primary" className="app-tabular">
                      {balance.available === null
                        ? t('create.unlimited')
                        : formatCount(balance.available, locale)}
                    </Typography>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-divider bg-background-paper p-3">
                <RangeCalendar
                  value={{ start: startDate, end: endDate }}
                  onChange={(range) => {
                    setValue('startDate', range.start);
                    setValue('endDate', range.end);
                  }}
                />
              </div>
              {/* What the request takes, before sending; a date error takes its place. */}
              <Typography
                variant="body2"
                role="status"
                aria-live="polite"
                color={rangeError || isOverBalance ? 'error' : 'textSecondary'}
                className="app-tabular"
              >
                {rangeError
                  ? message(rangeError, { max: TIME_OFF_LIMITS.periodDays })
                  : days === 0
                    ? t('create.summaryNone')
                    : `${formatPeriod(startDate, endDate, locale)} · ${t('create.summary', { count: days })}${
                        isOverBalance ? ` · ${t('create.overBalance')}` : ''
                      }`}
              </Typography>
            </section>
          </div>
          <TextField
            {...register('note')}
            multiline
            minRows={3}
            label={t('create.note')}
            placeholder={t('create.notePlaceholder')}
            error={Boolean(errors.note)}
            helperText={message(errors.note, {
              max: TIME_OFF_LIMITS.note,
              hint: t('create.noteHint'),
            })}
            slotProps={{
              input: { className: 'bg-background-paper' },
              htmlInput: { maxLength: TIME_OFF_LIMITS.note },
            }}
          />
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
            {t('create.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? t('create.submitting') : t('create.submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
