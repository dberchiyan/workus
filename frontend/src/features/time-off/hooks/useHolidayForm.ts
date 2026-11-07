import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { type HolidayFormOutput, type HolidayFormValues, holidaySchema } from '../schemas';
import type { Holiday } from '../types';
import { useCreateHoliday, useUpdateHoliday } from './useHolidays';

const FIELDS = new Set<string>(['date', 'name', 'recurring']);
const isField = (field: string): field is keyof HolidayFormValues => FIELDS.has(field);

/**
 * Add a holiday (`holiday` undefined) or change one. One Idempotency-Key per dialog, reused on
 * every retry of that add (the dialog remounts on each opening).
 */
export const useHolidayForm = (
  holiday: Holiday | undefined,
  defaultDate: string,
  onDone: () => void,
) => {
  const create = useCreateHoliday();
  const update = useUpdateHoliday();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  // An actionable error that is not a field's gets the focus (ux.md → Focus).
  useEffect(() => {
    if (errorCode) {
      errorRef.current?.focus();
    }
  }, [errorCode]);
  const form = useForm<HolidayFormValues, unknown, HolidayFormOutput>({
    resolver: zodResolver(holidaySchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: holiday
      ? { date: holiday.date, name: holiday.name, recurring: holiday.recurring }
      : { date: defaultDate, name: '', recurring: true },
  });

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    try {
      if (holiday) {
        await update.mutateAsync({
          holidayId: holiday.id,
          request: { ...values, version: holiday.version },
        });
      } else {
        await create.mutateAsync({ request: values, idempotencyKey });
      }
      onDone();
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      const fieldErrors = error.details.filter((detail) => isField(detail.field));
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
        setErrorCode(error.code);
      }
    }
  });

  return { form, submit, errorCode, errorRef, isSubmitting: form.formState.isSubmitting };
};
