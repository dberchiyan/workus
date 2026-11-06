import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useId, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PeoplePicker } from '@/shared/components/PeoplePicker';
import { FeedbackTabsField } from './FeedbackTabsField';
import { useReviewForm } from '../hooks/useReviewForm';
import { RESERVED_LINE, useFieldMessage } from '../hooks/useFieldMessage';
import { useReviewCandidates } from '../hooks/useReviewQueries';
import { REVIEW_LIMITS, REVIEW_STATUSES } from '../schemas';
import type { Review } from '../types';

export interface ReviewFormDialogProps {
  employeeId: string;
  /** null → add a review; otherwise edit this one. */
  review: Review | null;
  open: boolean;
  onClose: () => void;
  onSaved: (review: Review) => void;
  onExited: () => void;
}

/** Add or edit: review details + feedback. Centred modal; full-screen on phones (ux.md). */
export function ReviewFormDialog({
  employeeId,
  review,
  open,
  onClose,
  onSaved,
  onExited,
}: ReviewFormDialogProps) {
  const { t } = useTranslation(['review', 'errors', 'validation']);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const message = useFieldMessage();
  const { form, submit, errorCode, errorRef, responsibles, selectResponsibles, isSubmitting } =
    useReviewForm(employeeId, review, onSaved);
  const isEdit = review !== null;
  const { register, control, formState } = form;
  const { errors } = formState;
  const [feedbackHr, feedbackTeamLead, feedbackTeam, feedbackClient] = form.watch([
    'feedbackHr',
    'feedbackTeamLead',
    'feedbackTeam',
    'feedbackClient',
  ]);
  const feedbackValues = { feedbackHr, feedbackTeamLead, feedbackTeam, feedbackClient };
  const [search, setSearch] = useState('');
  const candidates = useReviewCandidates(search, open);

  // Dialog open → first control (ux.md → Focus moves with the UI).
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        form.setFocus('title');
      });
    }
  }, [open, form]);

  const close = (): void => {
    if (isSubmitting) {
      return;
    }
    onClose();
  };

  const options = (candidates.data ?? []).map((person) => ({
    ...person,
    subtitle: person.positionTitle ?? t(`add.responsible.roles.${person.role}`),
  }));

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
      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => void submit(event)}
      >
        <DialogTitle id={titleId}>{isEdit ? t('edit.title') : t('add.title')}</DialogTitle>
        <DialogContent dividers className="flex flex-col gap-6">
          <fieldset className="m-0 grid grid-cols-1 gap-x-4 gap-y-2 border-0 p-0 sm:grid-cols-2">
            <Typography variant="subtitle2" component="legend" className="mb-3 p-0">
              {t('add.sections.details')}
            </Typography>
            <TextField
              {...register('title')}
              required
              label={t('add.fields.title')}
              error={Boolean(errors.title)}
              helperText={message(errors.title, REVIEW_LIMITS.title)}
              className="sm:col-span-2"
              slotProps={{ htmlInput: { maxLength: REVIEW_LIMITS.title } }}
            />
            <TextField
              {...register('date')}
              type="date"
              required
              label={t('add.fields.date')}
              error={Boolean(errors.date)}
              helperText={message(errors.date)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Controller
              control={control}
              name="status"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  required
                  label={t('add.fields.status')}
                  error={Boolean(fieldState.error)}
                  helperText={message(fieldState.error)}
                >
                  {REVIEW_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {t(`status.${status}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              {...register('salary')}
              label={t('add.fields.salary')}
              error={Boolean(errors.salary)}
              helperText={message(errors.salary)}
              slotProps={{
                htmlInput: {
                  inputMode: 'decimal',
                  autoComplete: 'off',
                  maxLength: 16,
                  className: 'app-tabular',
                },
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              }}
            />
            <div className="sm:col-span-2">
              <PeoplePicker
                label={t('add.fields.responsibles')}
                required
                value={responsibles}
                onChange={selectResponsibles}
                options={options}
                isLoading={candidates.isFetching}
                onSearch={setSearch}
                max={REVIEW_LIMITS.responsibles}
                error={Boolean(errors.responsibleUserIds)}
                helperText={message(errors.responsibleUserIds, REVIEW_LIMITS.responsibles)}
                noOptionsText={t('add.responsible.noOptions')}
                loadingText={t('add.responsible.loading')}
              />
            </div>
          </fieldset>
          <fieldset className="m-0 border-0 p-0">
            <Typography variant="subtitle2" component="legend" className="mb-1 p-0">
              {t('add.sections.feedback')}
            </Typography>
            <FeedbackTabsField
              control={control}
              values={feedbackValues}
              errors={{
                hr: errors.feedbackHr?.message,
                teamLead: errors.feedbackTeamLead?.message,
                team: errors.feedbackTeam?.message,
                client: errors.feedbackClient?.message,
              }}
            />
          </fieldset>
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
            {t('add.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? isEdit
                ? t('edit.submitting')
                : t('add.actions.submitting')
              : isEdit
                ? t('edit.submit')
                : t('add.actions.submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
