import MailOutlined from '@mui/icons-material/MailOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import type { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { isLoginValidationMessage, LOGIN_FIELD_LIMITS, type LoginFormValues } from '../schemas';
import { useLoginForm } from '../hooks/useLoginForm';
import { PasswordField } from './PasswordField';

/** Keeps one line of error space under every field and above the button, so nothing shifts. */
const RESERVED_LINE = '\u00A0';

export function LoginForm() {
  const { t } = useTranslation(['auth', 'validation', 'errors']);
  const { form, onSubmit, errorCode, errorSummaryRef, isSessionExpired } = useLoginForm();
  const { register, formState } = form;
  const { errors, isSubmitting } = formState;

  /** Client errors carry i18n keys; server field errors arrive already localised. */
  const fieldMessage = (field: keyof LoginFormValues, error: FieldError | undefined): string => {
    if (!error?.message) {
      return RESERVED_LINE;
    }
    if (error.type === 'server' || !isLoginValidationMessage(error.message)) {
      return error.message;
    }
    return t(error.message, { max: LOGIN_FIELD_LIMITS[field] });
  };

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-3">
      {isSessionExpired && (
        <Alert severity="info" role="status">
          {t('login.sessionExpired')}
        </Alert>
      )}
      <TextField
        {...register('email')}
        label={t('login.email')}
        type="email"
        autoComplete="username"
        required
        fullWidth
        error={Boolean(errors.email)}
        helperText={fieldMessage('email', errors.email)}
        slotProps={{
          htmlInput: { inputMode: 'email', autoCapitalize: 'none', spellCheck: false },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <MailOutlined aria-hidden />
              </InputAdornment>
            ),
          },
        }}
      />
      <PasswordField
        {...register('password')}
        label={t('login.password')}
        autoComplete="current-password"
        required
        fullWidth
        error={Boolean(errors.password)}
        helperText={fieldMessage('password', errors.password)}
      />
      <FormHelperText
        component="div"
        role="alert"
        ref={errorSummaryRef}
        tabIndex={-1}
        error
        className="outline-none"
      >
        {errorCode ? t(`errors:${errorCode}`) : RESERVED_LINE}
      </FormHelperText>
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t('login.submitting') : t('login.submit')}
      </Button>
    </form>
  );
}
