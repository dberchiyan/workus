import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import FormHelperText from '@mui/material/FormHelperText';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { useOrganisation, useRenameOrganisation } from '../hooks/useOrganisation';
import { ORGANISATION_LIMITS, renameSchema, type RenameValues } from '../schemas';
import type { Organisation } from '../types';

const RESERVED_LINE = ' ';

/** The name form; it sends back the latest version it was given. */
function RenameForm({ organisation }: { organisation: Organisation }) {
  const { t } = useTranslation(['organisation', 'validation', 'errors']);
  const rename = useRenameOrganisation();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [done, setDone] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const form = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { name: organisation.name },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (errorCode) {
      errorRef.current?.focus();
    }
  }, [errorCode]);
  useEffect(() => {
    if (done) {
      doneRef.current?.focus();
    }
  }, [done]);

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    setDone(false);
    try {
      await rename.mutateAsync({ name: values.name, version: organisation.version });
      setDone(true);
    } catch (caught) {
      if (!isApiError(caught)) {
        throw caught;
      }
      const nameError = caught.details.find((detail) => detail.field === 'name');
      if (nameError) {
        form.setError(
          'name',
          { type: 'server', message: nameError.message },
          { shouldFocus: true },
        );
      } else {
        setErrorCode(caught.code);
      }
    }
  });

  const nameMessage = errors.name?.message
    ? errors.name.message.startsWith('validation:')
      ? t(errors.name.message as 'validation:organisationName.required', {
          max: ORGANISATION_LIMITS.organisationName,
        })
      : errors.name.message
    : RESERVED_LINE;

  return (
    <form
      noValidate
      className="flex max-w-md flex-col gap-2"
      onSubmit={(event) => void submit(event)}
    >
      {done && (
        <Alert ref={doneRef} tabIndex={-1} severity="success" className="mb-2 outline-none">
          {t('settings.organisation.done')}
        </Alert>
      )}
      <TextField
        {...form.register('name')}
        label={t('settings.organisation.name')}
        autoComplete="organization"
        required
        error={Boolean(errors.name)}
        helperText={nameMessage}
        slotProps={{ htmlInput: { maxLength: ORGANISATION_LIMITS.organisationName } }}
      />
      <FormHelperText
        component="div"
        role="alert"
        ref={errorRef}
        tabIndex={-1}
        error
        className="m-0 outline-none"
      >
        {errorCode ? t(`errors:${errorCode}`) : RESERVED_LINE}
      </FormHelperText>
      <div>
        <Button type="submit" variant="contained" loading={isSubmitting}>
          {t('settings.organisation.submit')}
        </Button>
      </div>
    </form>
  );
}

/** Settings → Organisation (owners): the company's name, shown to everyone in it. */
export function OrganisationSection() {
  const { t } = useTranslation('organisation');
  const titleId = useId();
  const organisation = useOrganisation();
  return (
    <Card component="section" aria-labelledby={titleId} className="flex flex-col">
      <div className="flex flex-col gap-0.5 border-b border-divider px-4 py-4 sm:px-6">
        <Typography id={titleId} variant="h6" component="h2">
          {t('settings.organisation.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('settings.organisation.description')}
        </Typography>
      </div>
      <div className="p-4 sm:p-6">
        {organisation.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void organisation.refetch()}>
                {t('settings.retry')}
              </Button>
            }
          >
            {t('settings.organisation.error')}
          </Alert>
        ) : organisation.data ? (
          <RenameForm key={organisation.data.id} organisation={organisation.data} />
        ) : (
          <div aria-busy="true" className="flex max-w-md flex-col gap-3">
            <span className="sr-only">{t('settings.loading')}</span>
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" width={120} height={36} />
          </div>
        )}
      </div>
    </Card>
  );
}
