import { zodResolver } from '@hookform/resolvers/zod';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { isApiError } from '@/shared/api/api-error';
import type { ErrorCode } from '@/shared/types';

import { type HolidayFormOutput, type HolidayFormValues, holidaySchema } from '../schemas';
import type { Holiday } from '../types';
import { useCreateHoliday, useUpdateHoliday } from './use-holidays';

const FIELDS = new Set<string>(['heldAt', 'name', 'isRecurring']);
const isField = (field: string): field is keyof HolidayFormValues => FIELDS.has(field);

/**
 * Add a holiday (`holiday` undefined) or change one. One Idempotency-Key per dialog, reused on
 * every retry of that add (the dialog remounts on each opening).
 */
export const useHolidayForm = (
    holiday: Holiday | undefined,
    defaultDate: string,
    onDone: () => void,
): {
    form: UseFormReturn<
        { heldAt: string; name: string; isRecurring: boolean },
        unknown,
        { heldAt: string; name: string; isRecurring: boolean }
    >;
    submit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    errorCode:
        | 'VALIDATION_FAILED'
        | 'MALFORMED_REQUEST'
        | 'INVALID_PARAMETER'
        | 'UNAUTHORIZED'
        | 'INVALID_CREDENTIALS'
        | 'SESSION_EXPIRED'
        | 'FORBIDDEN'
        | 'ACCESS_ENDED'
        | 'ORGANISATION_NOT_ACTIVE'
        | 'DEMO_RESTRICTED'
        | 'PLAN_UPGRADE_REQUIRED'
        | 'PLAN_LIMIT_REACHED'
        | 'RESOURCE_NOT_FOUND'
        | 'CONFLICT'
        | 'CONCURRENT_MODIFICATION'
        | 'IDEMPOTENCY_KEY_REUSED'
        | 'BUSINESS_RULE_VIOLATION'
        | 'PAYLOAD_TOO_LARGE'
        | 'UNSUPPORTED_MEDIA_TYPE'
        | 'RATE_LIMIT_EXCEEDED'
        | 'UPSTREAM_UNAVAILABLE'
        | 'INTERNAL_ERROR'
        | null;
    errorRef: RefObject<HTMLDivElement | null>;
    isSubmitting: boolean;
} => {
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
            ? { heldAt: holiday.heldAt, name: holiday.name, isRecurring: holiday.isRecurring }
            : { heldAt: defaultDate, name: '', isRecurring: true },
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
                    form.setError(detail.field, { type: 'server', message: detail.message }, { shouldFocus: true });
                }
            }
            if (fieldErrors.length === 0) {
                setErrorCode(error.code);
            }
        }
    });

    return { form, submit, errorCode, errorRef, isSubmitting: form.formState.isSubmitting };
};
