import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { type LoginFormOutput, type LoginFormValues, loginSchema } from '../schemas';
import { useLogin } from './useLogin';
import { useLoginRedirect } from './useLoginRedirect';

const FORM_FIELDS: ReadonlySet<string> = new Set(['email', 'password']);
const isFormField = (field: string): field is keyof LoginFormValues => FORM_FIELDS.has(field);

/** Sign-in form state: validation, submit, server error mapping and redirect. */
export const useLoginForm = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const { target, isSessionExpired } = useLoginRedirect();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [serverErrorCount, setServerErrorCount] = useState(0);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // An actionable async error takes focus (ux.md → Focus moves with the UI).
  useEffect(() => {
    if (serverErrorCount > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [serverErrorCount]);

  const form = useForm<LoginFormValues, unknown, LoginFormOutput>({
    resolver: zodResolver(loginSchema),
    // Errors appear only when the form is submitted; the layout reserves their space.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      setErrorCode(null);
      try {
        await login.mutateAsync(values);
        await navigate(target, { replace: true });
      } catch (error) {
        if (!isApiError(error)) {
          throw error;
        }
        for (const detail of error.details) {
          if (isFormField(detail.field)) {
            form.setError(detail.field, { type: 'server', message: detail.message });
          }
        }
        if (error.code === 'INVALID_CREDENTIALS') {
          form.resetField('password', { keepError: false });
        }
        setErrorCode(error.code);
        setServerErrorCount((count) => count + 1);
      }
    },
    () => {
      // Field messages say what is wrong; focus goes to the first invalid field.
      setErrorCode(null);
    },
  );

  return { form, onSubmit, errorCode, errorSummaryRef, isSessionExpired };
};
