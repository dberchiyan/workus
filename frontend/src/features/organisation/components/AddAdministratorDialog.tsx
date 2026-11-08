import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useId, useRef, useState } from 'react';
import { type FieldError, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import { CredentialsCard } from '@/shared/components/CredentialsCard';
import type { ErrorCode } from '@/shared/types';
import { useAddAdministrator } from '../hooks/useOrganisation';
import {
  addAdministratorSchema,
  type AddAdministratorOutput,
  type AddAdministratorValues,
  ORGANISATION_LIMITS,
} from '../schemas';
import type { AddedAdministrator } from '../types';

/** Keeps every helper line's height while it is empty, so the form never shifts. */
const RESERVED_LINE = ' ';
const FIELDS = new Set<string>(['firstName', 'lastName', 'email']);
const isField = (field: string): field is keyof AddAdministratorValues => FIELDS.has(field);

export interface AddAdministratorDialogProps {
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}

/**
 * An owner adds an admin: name and work email, then — once created — the sign-in details with
 * the generated password, shown this once. That step closes only through Done, after the
 * password was copied or marked as saved. Remounted on each opening (one Idempotency-Key).
 */
export function AddAdministratorDialog({ open, onClose, onExited }: AddAdministratorDialogProps) {
  const { t } = useTranslation(['organisation', 'common', 'validation', 'errors']);
  const titleId = useId();
  const doneHintId = useId();
  const theme = useTheme();
  // Behaviour CSS cannot express: a full-screen sheet on phones (ux.md → Patterns).
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const add = useAddAdministrator();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [added, setAdded] = useState<AddedAdministrator | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const form = useForm<AddAdministratorValues, unknown, AddAdministratorOutput>({
    resolver: zodResolver(addAdministratorSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { firstName: '', lastName: '', email: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const canFinish = isSaved || added?.temporaryPassword === null;

  useEffect(() => {
    if (errorCode) {
      errorRef.current?.focus();
    }
  }, [errorCode]);

  const message = (field: keyof AddAdministratorValues, error: FieldError | undefined): string =>
    error?.message
      ? error.message.startsWith('validation:')
        ? t(error.message as 'validation:email.invalid', { max: ORGANISATION_LIMITS[field] })
        : error.message
      : RESERVED_LINE;

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    try {
      setAdded(await add.mutateAsync({ request: values, idempotencyKey }));
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

  const finish = (): void => {
    // The password leaves memory with the dialog.
    setAdded(null);
    add.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      // The sign-in details close only through Done, so the password is not lost by accident.
      onClose={added || isSubmitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isPhone}
      aria-labelledby={titleId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t('settings.administrators.add.title')}</DialogTitle>
      {added ? (
        <>
          <DialogContent dividers>
            <CredentialsCard
              name={`${added.firstName} ${added.lastName}`}
              email={added.email}
              password={added.temporaryPassword}
              saved={canFinish}
              onSavedChange={setIsSaved}
              title={t('settings.administrators.add.doneTitle', {
                name: `${added.firstName} ${added.lastName}`,
              })}
              description={t('settings.administrators.add.doneDescription')}
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
        <form noValidate className="flex flex-col" onSubmit={(event) => void submit(event)}>
          <DialogContent dividers className="flex flex-col gap-2">
            <DialogContentText className="mb-3">
              {t('settings.administrators.add.description')}
            </DialogContentText>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <TextField
                {...form.register('firstName')}
                label={t('settings.administrators.add.firstName')}
                autoComplete="off"
                required
                error={Boolean(errors.firstName)}
                helperText={message('firstName', errors.firstName)}
                slotProps={{ htmlInput: { maxLength: ORGANISATION_LIMITS.firstName } }}
              />
              <TextField
                {...form.register('lastName')}
                label={t('settings.administrators.add.lastName')}
                autoComplete="off"
                required
                error={Boolean(errors.lastName)}
                helperText={message('lastName', errors.lastName)}
                slotProps={{ htmlInput: { maxLength: ORGANISATION_LIMITS.lastName } }}
              />
            </div>
            <TextField
              {...form.register('email')}
              label={t('settings.administrators.add.email')}
              type="email"
              autoComplete="off"
              required
              error={Boolean(errors.email)}
              helperText={message('email', errors.email)}
              slotProps={{
                htmlInput: {
                  inputMode: 'email',
                  autoCapitalize: 'none',
                  spellCheck: false,
                  maxLength: ORGANISATION_LIMITS.email,
                },
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
            <Button onClick={onClose} disabled={isSubmitting}>
              {t('settings.administrators.add.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {t('settings.administrators.add.submit')}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}
