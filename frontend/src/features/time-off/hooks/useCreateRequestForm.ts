import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import {
  type CreateTimeOffFormOutput,
  type CreateTimeOffFormValues,
  createTimeOffSchema,
} from '../schemas';
import { useCreateTimeOffRequest } from './useTimeOffQueries';

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const FORM_FIELDS: ReadonlySet<string> = new Set(['type', 'startDate', 'endDate', 'note']);
const isFormField = (field: string): field is keyof CreateTimeOffFormValues =>
  FORM_FIELDS.has(field);

/**
 * Create request. One Idempotency-Key per opening of the dialog (it remounts per opening),
 * reused on every retry of that submission.
 */
export const useCreateRequestForm = (onCreated: () => void) => {
  const create = useCreateTimeOffRequest();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const form = useForm<CreateTimeOffFormValues, unknown, CreateTimeOffFormOutput>({
    resolver: zodResolver(createTimeOffSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { type: 'VACATION', startDate: todayIso(), endDate: todayIso(), note: '' },
  });

  useEffect(() => {
    if (errorCount > 0) {
      errorRef.current?.focus();
    }
  }, [errorCount]);

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    try {
      await create.mutateAsync({
        request: {
          type: values.type,
          startDate: values.startDate,
          endDate: values.endDate,
          ...(values.note === '' ? {} : { note: values.note }),
        },
        idempotencyKey,
      });
      onCreated();
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      let hasFieldError = false;
      for (const detail of error.details) {
        if (isFormField(detail.field)) {
          form.setError(
            detail.field,
            { type: 'server', message: detail.message },
            { shouldFocus: !hasFieldError },
          );
          hasFieldError = true;
        }
      }
      if (!hasFieldError) {
        setErrorCode(error.code);
        setErrorCount((count) => count + 1);
      }
    }
  });

  return { form, submit, errorCode, errorRef, isSubmitting: form.formState.isSubmitting };
};
