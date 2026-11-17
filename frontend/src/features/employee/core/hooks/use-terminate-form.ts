import { zodResolver } from '@hookform/resolvers/zod';
import { type BaseSyntheticEvent, type RefObject, useEffect, useRef, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';

import { isApiError } from '@/shared/api/api-error';
import { todayUtcIso as todayIso } from '@/shared/lib/utc-day';
import type { ErrorCode } from '@/shared/types';

import { isTerminationReason, type TerminateEmployeeFormValues, terminateEmployeeSchema } from '../schemas';
import type { EmployeeProfile } from '../types';
import { useTerminateEmployee } from './use-employee-queries';

const FORM_FIELDS: ReadonlySet<string> = new Set(['terminatedAt', 'reason', 'comment']);
const isFormField = (field: string): field is keyof TerminateEmployeeFormValues => FORM_FIELDS.has(field);

/**
 * Terminate, or change an existing termination (prefilled). Sends the version read when the
 * dialog opened (it remounts per opening).
 */
export const useTerminateForm = (
    employee: EmployeeProfile,
    onSaved: () => void,
): {
    form: UseFormReturn<TerminateEmployeeFormValues>;
    submit: (event?: BaseSyntheticEvent) => Promise<void>;
    errorCode: ErrorCode | null;
    errorRef: RefObject<HTMLDivElement | null>;
    isSubmitting: boolean;
} => {
    const terminate = useTerminateEmployee(employee.id);
    const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
    const [errorCount, setErrorCount] = useState(0);
    const errorRef = useRef<HTMLDivElement>(null);
    const form = useForm<TerminateEmployeeFormValues>({
        resolver: zodResolver(terminateEmployeeSchema),
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
        defaultValues: {
            terminatedAt: employee.terminatedAt ?? todayIso(),
            reason: employee.termination?.reason ?? '',
            comment: employee.termination?.comment ?? '',
        },
    });

    useEffect(() => {
        if (errorCount > 0) {
            errorRef.current?.focus();
        }
    }, [errorCount]);

    const submit = form.handleSubmit(async (values) => {
        setErrorCode(null);
        if (!isTerminationReason(values.reason)) {
            return;
        }
        try {
            await terminate.mutateAsync({
                terminatedAt: values.terminatedAt,
                reason: values.reason,
                ...(values.comment.trim() === '' ? {} : { comment: values.comment.trim() }),
                version: employee.version,
            });
            onSaved();
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
