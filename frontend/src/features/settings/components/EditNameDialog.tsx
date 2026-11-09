import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useId, useRef, useState } from 'react';
import { type FieldError, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type CurrentUser, useUpdateOwnName } from '@/features/auth';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { type EditNameValues, editNameSchema, NAME_LIMITS } from '../schemas';

/** Keeps every helper line's height while it is empty, so the form never shifts. */
const RESERVED_LINE = ' ';
const FIELDS = new Set<string>(['firstName', 'lastName']);
const isField = (field: string): field is keyof EditNameValues => FIELDS.has(field);

export interface EditNameDialogProps {
  open: boolean;
  user: CurrentUser;
  onClose: () => void;
  onExited: () => void;
}

/**
 * Admins and owners rename themselves: first and last name, Save. Closes on success — the
 * profile card, the account menu and every list then show the new name. Remounted on each
 * opening, so the fields start from the current name.
 */
export function EditNameDialog({ open, user, onClose, onExited }: EditNameDialogProps) {
  const { t } = useTranslation(['settings', 'validation', 'errors']);
  const titleId = useId();
  const textId = useId();
  const theme = useTheme();
  // Behaviour CSS cannot express: a full-screen sheet on phones (ux.md → Patterns).
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const update = useUpdateOwnName();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const form = useForm<EditNameValues>({
    resolver: zodResolver(editNameSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });
  const { errors, isSubmitting } = form.formState;

  // Opening focuses the first field (the dialog mounts with each opening).
  useEffect(() => {
    requestAnimationFrame(() => {
      form.setFocus('firstName');
    });
  }, [form]);
  useEffect(() => {
    if (errorCode) {
      errorRef.current?.focus();
    }
  }, [errorCode]);

  const message = (error: FieldError | undefined, max: number): string =>
    error?.message
      ? error.message.startsWith('validation:')
        ? t(error.message as 'validation:firstName.tooLong', { max })
        : error.message
      : RESERVED_LINE;

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    try {
      await update.mutateAsync(values);
      onClose();
    } catch (caught) {
      if (!isApiError(caught)) {
        throw caught;
      }
      const fieldErrors = caught.details.filter((detail) => isField(detail.field));
      for (const detail of fieldErrors) {
        if (isField(detail.field)) {
          form.setError(
            detail.field,
            { type: 'server', message: detail.message },
            { shouldFocus: true },
          );
        }
      }
      if (fieldErrors.length === 0) {
        setErrorCode(caught.code);
      }
    }
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isPhone}
      aria-labelledby={titleId}
      aria-describedby={textId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t('account.profile.dialog.title')}</DialogTitle>
      <form noValidate className="flex flex-col" onSubmit={(event) => void submit(event)}>
        <DialogContent dividers className="flex flex-col gap-2">
          <DialogContentText id={textId} className="mb-3">
            {t('account.profile.dialog.description')}
          </DialogContentText>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <TextField
              {...form.register('firstName')}
              label={t('account.profile.firstName')}
              autoComplete="given-name"
              required
              error={Boolean(errors.firstName)}
              helperText={message(errors.firstName, NAME_LIMITS.firstName)}
              slotProps={{ htmlInput: { maxLength: NAME_LIMITS.firstName } }}
            />
            <TextField
              {...form.register('lastName')}
              label={t('account.profile.lastName')}
              autoComplete="family-name"
              required
              error={Boolean(errors.lastName)}
              helperText={message(errors.lastName, NAME_LIMITS.lastName)}
              slotProps={{ htmlInput: { maxLength: NAME_LIMITS.lastName } }}
            />
          </div>
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
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('account.profile.dialog.cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('account.profile.dialog.submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
