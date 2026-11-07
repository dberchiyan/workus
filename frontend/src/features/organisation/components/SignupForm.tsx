import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState } from 'react';
import { type FieldError, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { isApiError } from '@/shared/api/apiError';
import { PasswordField } from '@/shared/components/PasswordField';
import { PasswordRules } from '@/shared/components/PasswordRules';
import { PASSWORD_LIMITS } from '@/shared/lib/passwordRules';
import { PATHS } from '@/shared/lib/paths';
import type { ErrorCode } from '@/shared/types';
import { useRegister } from '../hooks/useOrganisation';
import {
  ORGANISATION_LIMITS,
  registrationSchema,
  type RegistrationOutput,
  type RegistrationValues,
} from '../schemas';

/** Keeps every helper line's height while it is empty, so the form never shifts. */
const RESERVED_LINE = ' ';
const FIELDS = new Set<string>(['organisationName', 'firstName', 'lastName', 'email', 'password']);
const isField = (field: string): field is keyof RegistrationValues => FIELDS.has(field);
const FIELD_MAX: Record<keyof RegistrationValues, number> = {
  ...ORGANISATION_LIMITS,
  password: PASSWORD_LIMITS.max,
};

type Step = 'company' | 'owner';

/**
 * Two steps: the company, then you (its owner). Creating it signs you in and opens the empty
 * company. Errors show when a step is submitted, in reserved lines.
 */
export function SignupForm() {
  const { t } = useTranslation(['organisation', 'validation', 'errors']);
  const navigate = useNavigate();
  const register = useRegister();
  const [step, setStep] = useState<Step>('company');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const rulesId = useId();
  const form = useForm<RegistrationValues, unknown, RegistrationOutput>({
    resolver: zodResolver(registrationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { organisationName: '', firstName: '', lastName: '', email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' });

  // A new step's heading takes focus, so screen readers hear where they are (not on first load).
  useEffect(() => {
    if (movedRef.current) {
      stepHeadingRef.current?.focus();
    }
    movedRef.current = true;
  }, [step]);
  useEffect(() => {
    if (errorCode) {
      errorRef.current?.focus();
    }
  }, [errorCode]);

  const message = (field: keyof RegistrationValues, error: FieldError | undefined): string =>
    error?.message
      ? error.message.startsWith('validation:')
        ? t(error.message as 'validation:email.invalid', {
            max: FIELD_MAX[field],
            min: PASSWORD_LIMITS.min,
          })
        : error.message
      : RESERVED_LINE;

  const toOwner = async (): Promise<void> => {
    if (await form.trigger('organisationName', { shouldFocus: true })) {
      setStep('owner');
    }
  };

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    try {
      await register.mutateAsync(values);
      await navigate(PATHS.dashboard, { replace: true });
    } catch (caught) {
      if (!isApiError(caught)) {
        throw caught;
      }
      const fieldErrors = caught.details.filter((detail) => isField(detail.field));
      if (fieldErrors.some((detail) => detail.field === 'organisationName')) {
        setStep('company');
      }
      for (const detail of fieldErrors) {
        if (isField(detail.field)) {
          form.setError(detail.field, { type: 'server', message: detail.message });
        }
      }
      if (fieldErrors.length === 0) {
        setErrorCode(caught.code);
      }
    }
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        if (step === 'company') {
          event.preventDefault();
          void toOwner();
        } else {
          void submit(event);
        }
      }}
    >
      <Typography variant="overline" component="p" color="textSecondary">
        {t('signup.step', { current: step === 'company' ? 1 : 2, total: 2 })}
      </Typography>
      <Typography
        ref={stepHeadingRef}
        tabIndex={-1}
        variant="h6"
        component="h2"
        className="mb-2 outline-none"
      >
        {step === 'company' ? t('signup.company.title') : t('signup.owner.title')}
      </Typography>
      {step === 'company' ? (
        <TextField
          {...form.register('organisationName')}
          label={t('signup.company.name')}
          autoComplete="organization"
          required
          fullWidth
          error={Boolean(errors.organisationName)}
          helperText={message('organisationName', errors.organisationName)}
          slotProps={{ htmlInput: { maxLength: ORGANISATION_LIMITS.organisationName } }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <TextField
              {...form.register('firstName')}
              label={t('signup.owner.firstName')}
              autoComplete="given-name"
              required
              error={Boolean(errors.firstName)}
              helperText={message('firstName', errors.firstName)}
              slotProps={{ htmlInput: { maxLength: ORGANISATION_LIMITS.firstName } }}
            />
            <TextField
              {...form.register('lastName')}
              label={t('signup.owner.lastName')}
              autoComplete="family-name"
              required
              error={Boolean(errors.lastName)}
              helperText={message('lastName', errors.lastName)}
              slotProps={{ htmlInput: { maxLength: ORGANISATION_LIMITS.lastName } }}
            />
          </div>
          <TextField
            {...form.register('email')}
            label={t('signup.owner.email')}
            type="email"
            autoComplete="username"
            required
            error={Boolean(errors.email)}
            helperText={errors.email ? message('email', errors.email) : t('signup.owner.emailHint')}
            slotProps={{
              htmlInput: {
                inputMode: 'email',
                autoCapitalize: 'none',
                spellCheck: false,
                maxLength: ORGANISATION_LIMITS.email,
              },
            }}
          />
          <PasswordField
            {...form.register('password')}
            autoComplete="new-password"
            label={t('signup.owner.password')}
            required
            error={Boolean(errors.password)}
            helperText={message('password', errors.password)}
            describedBy={rulesId}
          />
          <PasswordRules id={rulesId} password={password} />
        </>
      )}
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
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step === 'owner' ? (
          <Button
            variant="text"
            size="large"
            onClick={() => {
              setStep('company');
            }}
          >
            {t('signup.back')}
          </Button>
        ) : (
          <span aria-hidden className="hidden sm:block" />
        )}
        <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
          {step === 'company' ? t('signup.continue') : t('signup.submit')}
        </Button>
      </div>
    </form>
  );
}
