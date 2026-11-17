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
import type { ReactElement } from 'react';
import { useEffect, useId } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ISO_YEAR_LENGTH } from '@/shared/lib/units';
import { todayUtcIso } from '@/shared/lib/utc-day';

import { formatCount, formatDay, formatPeriod, workingDaysBetween } from '../format';
import { useCreateRequestForm } from '../hooks/use-create-request-form';
import { RESERVED_LINE, useFieldMessage } from '../hooks/use-field-message';
import { useHolidayNames } from '../hooks/use-holidays';
import { TIME_OFF_LIMITS } from '../schemas';
import type { LeaveBalance } from '../types';
import { RangeCalendar } from './range-calendar';
import { TypeOptions } from './type-options';

export interface CreateRequestDialogProps {
    open: boolean;
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
}: CreateRequestDialogProps): ReactElement {
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
    const [type, startsAt, endsAt] = watch(['type', 'startsAt', 'endsAt']);
    const thisYear = Number(todayUtcIso().slice(0, ISO_YEAR_LENGTH));
    const holidays = useHolidayNames([
        thisYear,
        thisYear + 1,
        Number(startsAt.slice(0, ISO_YEAR_LENGTH)) || thisYear,
        Number(endsAt.slice(0, ISO_YEAR_LENGTH)) || thisYear,
    ]);
    const days = workingDaysBetween(startsAt, endsAt, holidays);
    const balance = balances.find((item) => item.type === type);
    const isOverBalance = balance?.available != null && days > balance.available;
    const rangeError = errors.startsAt ?? errors.endsAt;

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
                                                start: formatDay(balance.cycleStartsAt, locale),
                                                end: formatDay(balance.cycleEndsAt, locale),
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
                                    value={{ start: startsAt, end: endsAt }}
                                    onChange={(range) => {
                                        setValue('startsAt', range.start);
                                        setValue('endsAt', range.end);
                                    }}
                                    holidays={holidays}
                                />
                            </div>
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
                                      : `${formatPeriod(startsAt, endsAt, locale)} · ${t('create.summary', { count: days })}${
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
                    <Button type="submit" variant="contained" disabled={isSubmitting} aria-busy={isSubmitting}>
                        {isSubmitting ? t('create.submitting') : t('create.submit')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
