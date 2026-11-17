import { zodResolver } from '@hookform/resolvers/zod';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { isApiError } from '@/shared/api/api-error';
import type { ErrorCode } from '@/shared/types';

import { type UpdateEmployeeFormOutput, type UpdateEmployeeFormValues, updateEmployeeSchema } from '../schemas';
import type { EmployeeProfile, UpdateEmployeeRequest } from '../types';
import { useUpdateEmployee } from './use-employee-queries';

const valuesFor = (employee: EmployeeProfile): UpdateEmployeeFormValues => ({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    positionId: employee.position.id,
    startsAt: employee.startsAt,
    mobile: employee.contacts.mobile ?? '',
    personalEmail: employee.contacts.personalEmail ?? '',
    linkedinUrl: employee.contacts.linkedinUrl ?? '',
    telegram: employee.contacts.telegram ?? '',
    address: employee.contacts.address ?? '',
    bornAt: employee.bornAt ?? '',
});

const FORM_FIELDS: ReadonlySet<string> = new Set([
    'firstName',
    'lastName',
    'email',
    'positionId',
    'startsAt',
    'mobile',
    'personalEmail',
    'linkedinUrl',
    'telegram',
    'address',
    'bornAt',
] satisfies (keyof UpdateEmployeeFormValues)[]);
const isFormField = (field: string): field is keyof UpdateEmployeeFormValues => FORM_FIELDS.has(field);

/** A blank contact is left out of the request, which clears it. */
const toRequest = (values: UpdateEmployeeFormOutput, version: number): UpdateEmployeeRequest => {
    const optional = (value: string) => (value === '' ? undefined : value);
    return {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        positionId: values.positionId,
        startsAt: values.startsAt,
        ...(optional(values.mobile) ? { mobile: values.mobile } : {}),
        ...(optional(values.personalEmail) ? { personalEmail: values.personalEmail } : {}),
        ...(optional(values.linkedinUrl) ? { linkedinUrl: values.linkedinUrl } : {}),
        ...(optional(values.telegram) ? { telegram: values.telegram } : {}),
        ...(optional(values.address) ? { address: values.address } : {}),
        ...(optional(values.bornAt) ? { bornAt: values.bornAt } : {}),
        version,
    };
};

/**
 * Edit profile. The dialog remounts on every opening (parent `key`), so it starts from the
 * profile as read and sends that version (a stale one is refused with "reload").
 */
export const useEditProfileForm = (
    employee: EmployeeProfile,
    onSaved: () => void,
): {
    form: UseFormReturn<
        {
            email: string;
            startsAt: string;
            positionId: string;
            firstName: string;
            lastName: string;
            mobile: string;
            personalEmail: string;
            linkedinUrl: string;
            telegram: string;
            address: string;
            bornAt: string;
        },
        unknown,
        {
            email: string;
            startsAt: string;
            positionId: string;
            firstName: string;
            lastName: string;
            mobile: string;
            personalEmail: string;
            linkedinUrl: string;
            telegram: string;
            address: string;
            bornAt: string;
        }
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
    const update = useUpdateEmployee(employee.id);
    const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
    const [errorCount, setErrorCount] = useState(0);
    const errorRef = useRef<HTMLDivElement>(null);
    const form = useForm<UpdateEmployeeFormValues, unknown, UpdateEmployeeFormOutput>({
        resolver: zodResolver(updateEmployeeSchema),
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
        defaultValues: valuesFor(employee),
    });

    useEffect(() => {
        if (errorCount > 0) {
            errorRef.current?.focus();
        }
    }, [errorCount]);

    const submit = form.handleSubmit(async (values) => {
        setErrorCode(null);
        try {
            await update.mutateAsync(toRequest(values, employee.version));
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
