import { zodResolver } from '@hookform/resolvers/zod';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { isApiError } from '@/shared/api/api-error';
import type { ErrorCode } from '@/shared/types';

import { type LoginFormOutput, type LoginFormValues, loginSchema } from '../schemas';
import { useLogin } from './use-login';
import { useLoginRedirect } from './use-login-redirect';

const FORM_FIELDS: ReadonlySet<string> = new Set(['email', 'password']);
const isFormField = (field: string): field is keyof LoginFormValues => FORM_FIELDS.has(field);

/** Sign-in form state: validation, submit, server error mapping and redirect. */
export const useLoginForm = (): {
    form: UseFormReturn<{ email: string; password: string }, unknown, { email: string; password: string }>;
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
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
    errorSummaryRef: RefObject<HTMLDivElement | null>;
    isSessionExpired: boolean;
} => {
    const navigate = useNavigate();
    const login = useLogin();
    const { target, isSessionExpired } = useLoginRedirect();
    const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
    const [serverErrorCount, setServerErrorCount] = useState(0);
    const errorSummaryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (serverErrorCount > 0) {
            errorSummaryRef.current?.focus();
        }
    }, [serverErrorCount]);

    const form = useForm<LoginFormValues, unknown, LoginFormOutput>({
        resolver: zodResolver(loginSchema),
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
            setErrorCode(null);
        },
    );

    return { form, onSubmit, errorCode, errorSummaryRef, isSessionExpired };
};
