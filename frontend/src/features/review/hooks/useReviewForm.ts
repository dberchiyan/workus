import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import {
  type CreateReviewFormOutput,
  type CreateReviewFormValues,
  createReviewSchema,
} from '../schemas';
import type { PickerPerson } from '@/shared/components/PeoplePicker';
import type { CreateReviewRequest, Review } from '../types';
import { useCreateReview, useUpdateReview } from './useReviewQueries';

const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** "5305.0000" → "5305", "6200.7500" → "6200.75" — string work only, never a number. */
const toInputAmount = (amount: string): string =>
  amount.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');

const valuesFor = (review: Review | null): CreateReviewFormValues => ({
  title: review?.title ?? '',
  date: review?.date ?? todayIso(),
  status: review?.status ?? '',
  salary: review?.salary ? toInputAmount(review.salary.amount) : '',
  responsibleUserIds: review?.responsibles.map((person) => person.id) ?? [],
  feedbackHr: review?.feedback.hr ?? null,
  feedbackTeamLead: review?.feedback.teamLead ?? null,
  feedbackTeam: review?.feedback.team ?? null,
  feedbackClient: review?.feedback.client ?? null,
});

const FORM_FIELDS: ReadonlySet<string> = new Set(Object.keys(valuesFor(null)));
const isFormField = (field: string): field is keyof CreateReviewFormValues =>
  FORM_FIELDS.has(field);
/** Server field names → form field names. */
const SERVER_FIELDS: Readonly<Record<string, keyof CreateReviewFormValues>> = {
  'feedback.hr': 'feedbackHr',
  'feedback.teamLead': 'feedbackTeamLead',
  'feedback.team': 'feedbackTeam',
  'feedback.client': 'feedbackClient',
};

const toRequest = (values: CreateReviewFormOutput): CreateReviewRequest => {
  return {
    title: values.title,
    date: values.date,
    status: values.status,
    ...(values.salary === '' ? {} : { salary: values.salary }),
    responsibleUserIds: values.responsibleUserIds,
    // null clears a source's feedback when editing.
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
) => {
  const create = useCreateReview(employeeId);
  const update = useUpdateReview(employeeId);
  // The dialog remounts on every opening (parent `key`), so initial state is per opening.
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
          form.setError(
            field,
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
