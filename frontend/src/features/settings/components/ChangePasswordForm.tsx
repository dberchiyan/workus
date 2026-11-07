import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import { useEffect, useId, useRef, useState } from 'react';
import { type FieldError, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useChangePassword } from '@/features/auth';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { type ChangePasswordValues, changePasswordSchema, PASSWORD_LIMITS } from '../schemas';
import { PasswordField } from './PasswordField';
import { PasswordRules } from './PasswordRules';

/** Keeps every helper line's height while it is empty, so the form never shifts. */
const RESERVED_LINE = ' ';
const FIELDS = new Set<string>(['currentPassword', 'newPassword', 'confirmPassword']);
const isField = (field: string): field is keyof ChangePasswordValues => FIELDS.has(field);

/**
 * Current password, new one twice. Success signs out every other device (the server ends all
 * sessions and gives this browser a new one) and says so.
 */
export function ChangePasswordForm() {
  const { t } = useTranslation(['settings', 'validation', 'errors']);
  const change = useChangePassword();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [done, setDone] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const rulesId = useId();
  // Live values for the rules box.
  const [currentPassword, newPassword, confirmPassword] = useWatch({
    control: form.control,
    name: ['currentPassword', 'newPassword', 'confirmPassword'],
  });

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

  const message = (error: FieldError | undefined, hint?: string): string =>
    error?.message
      ? error.message.startsWith('validation:')
        ? t(error.message as 'validation:password.tooLong', PASSWORD_LIMITS)
        : error.message
      : (hint ?? RESERVED_LINE);

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    setDone(false);
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      form.reset();
      setDone(true);
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
    // One-off geometry: the rules box is wide enough for every rule on one line.
    <form
      noValidate
      className="grid grid-cols-1 gap-6 @3xl:grid-cols-[minmax(0,28rem)_22rem]"
      onSubmit={(event) => void submit(event)}
    >
      <div className="flex flex-col gap-2">
        {done && (
          <Alert ref={doneRef} tabIndex={-1} severity="success" className="mb-2 outline-none">
            {t('account.password.done')}
          </Alert>
        )}
        <PasswordField
          {...form.register('currentPassword')}
          autoComplete="current-password"
          label={t('account.password.current')}
          required
          error={Boolean(errors.currentPassword)}
          helperText={message(errors.currentPassword)}
        />
        <PasswordField
          {...form.register('newPassword')}
          autoComplete="new-password"
          label={t('account.password.new')}
          required
          error={Boolean(errors.newPassword)}
          helperText={message(errors.newPassword)}
          describedBy={rulesId}
        />
        <PasswordField
          {...form.register('confirmPassword')}
          autoComplete="new-password"
          label={t('account.password.confirm')}
          required
          error={Boolean(errors.confirmPassword)}
          helperText={message(errors.confirmPassword)}
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
            {t('account.password.submit')}
          </Button>
        </div>
      </div>
      <PasswordRules
        id={rulesId}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        currentPassword={currentPassword}
      />
    </form>
  );
}
