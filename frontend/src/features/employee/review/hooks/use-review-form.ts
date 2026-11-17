import { zodResolver } from '@hookform/resolvers/zod';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { isApiError } from '@/shared/api/api-error';
import type { PickerPerson } from '@/shared/components/people-picker';
import { todayUtcIso as todayIso } from '@/shared/lib/utc-day';
import type { ErrorCode } from '@/shared/types';
import type { components } from '@/shared/types/api';

import { type CreateReviewFormOutput, type CreateReviewFormValues, createReviewSchema } from '../schemas';
import type { CreateReviewRequest, Review } from '../types';
import { useCreateReview, useUpdateReview } from './use-review-queries';

/** "5305.0000" → "5305", "6200.7500" → "6200.75" — string work only, never a number. */
const toInputAmount = (amount: string): string => amount.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');

const valuesFor = (review: Review | null): CreateReviewFormValues => ({
    title: review?.title ?? '',
    reviewedAt: review?.reviewedAt ?? todayIso(),
    status: review?.status ?? '',
    salary: review?.salary ? toInputAmount(review.salary.amount) : '',
    responsibleUserIds: review?.responsibles.map((person) => person.id) ?? [],
    feedbackHr: review?.feedback.hr ?? null,
    feedbackTeamLead: review?.feedback.teamLead ?? null,
    feedbackTeam: review?.feedback.team ?? null,
    feedbackClient: review?.feedback.client ?? null,
});

const FORM_FIELDS: ReadonlySet<string> = new Set(Object.keys(valuesFor(null)));
const isFormField = (field: string): field is keyof CreateReviewFormValues => FORM_FIELDS.has(field);
const SERVER_FIELDS: Readonly<Record<string, keyof CreateReviewFormValues>> = {
    'feedback.hr': 'feedbackHr',
    'feedback.teamLead': 'feedbackTeamLead',
    'feedback.team': 'feedbackTeam',
    'feedback.client': 'feedbackClient',
};

const toRequest = (values: CreateReviewFormOutput): CreateReviewRequest => {
    return {
        title: values.title,
        reviewedAt: values.reviewedAt,
        status: values.status,
        ...(values.salary === '' ? {} : { salary: values.salary }),
        responsibleUserIds: values.responsibleUserIds,
        feedback: {
            hr: values.feedbackHr,
            teamLead: values.feedbackTeamLead,
            team: values.feedbackTeam,
            client: values.feedbackClient,
        },
    };
};

/**
 * Add (review = null) or edit a review. Add uses one Idempotency-Key per opening, reused on every
 * retry; edit sends the version it read (optimistic locking).
 */
export const useReviewForm = (
    employeeId: string,
    review: Review | null,
    onSaved: (review: Review) => void,
): {
    form: UseFormReturn<
        {
            title: string;
            reviewedAt: string;
            status: '' | 'CANCELED' | 'COMPLETED' | 'SCHEDULED';
            salary: string;
            responsibleUserIds: string[];
            feedbackHr: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            feedbackTeamLead: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            feedbackTeam: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            feedbackClient: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
        },
        unknown,
        {
            title: string;
            reviewedAt: string;
            status: 'CANCELED' | 'COMPLETED' | 'SCHEDULED';
            salary: string;
            responsibleUserIds: string[];
            feedbackHr: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            feedbackTeamLead: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            feedbackTeam: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
            feedbackClient: {
                type: 'doc';
                content: components['schemas']['EmployeeReviewsResponse_Output__schema0_Output'][];
            } | null;
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
    responsibles: PickerPerson[];
    selectResponsibles: (people: PickerPerson[]) => void;
    isSubmitting: boolean;
} => {
    const create = useCreateReview(employeeId);
    const update = useUpdateReview(employeeId);
    const [idempotencyKey] = useState(() => crypto.randomUUID());
    const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
    const [errorCount, setErrorCount] = useState(0);
    const [responsibles, setResponsibles] = useState<PickerPerson[]>(
        () => review?.responsibles.map((person) => ({ ...person, subtitle: '' })) ?? [],
    );
    const errorRef = useRef<HTMLDivElement>(null);

    const form = useForm<CreateReviewFormValues, unknown, CreateReviewFormOutput>({
        resolver: zodResolver(createReviewSchema),
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
        defaultValues: valuesFor(review),
    });

    useEffect(() => {
        if (errorCount > 0) {
            errorRef.current?.focus();
        }
    }, [errorCount]);

    const selectResponsibles = (people: PickerPerson[]): void => {
        setResponsibles(people);
        form.setValue(
            'responsibleUserIds',
            people.map((person) => person.id),
        );
    };

    const submit = form.handleSubmit(async (values) => {
        setErrorCode(null);
        try {
            const saved = review
                ? await update.mutateAsync({
                      reviewId: review.id,
                      request: { ...toRequest(values), version: review.version },
                  })
                : await create.mutateAsync({ request: toRequest(values), idempotencyKey });
            onSaved(saved);
        } catch (error) {
            if (!isApiError(error)) {
                throw error;
            }
            let hasFieldError = false;
            for (const detail of error.details) {
                const field = SERVER_FIELDS[detail.field] ?? detail.field;
                if (isFormField(field)) {
                    form.setError(field, { type: 'server', message: detail.message }, { shouldFocus: !hasFieldError });
                    hasFieldError = true;
                }
            }
            if (!hasFieldError) {
                setErrorCode(error.code);
                setErrorCount((count) => count + 1);
            }
        }
    });

    return {
        form,
        submit,
        errorCode,
        errorRef,
        responsibles,
        selectResponsibles,
        isSubmitting: form.formState.isSubmitting,
    };
};
