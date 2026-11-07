import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { type CommentFormOutput, type CommentFormValues, commentSchema } from '../schemas';
import { type CommentScope, useAddComment } from './useManagedRequests';

/**
 * One Idempotency-Key per comment being written, reused on every retry of that send; a sent
 * comment clears the field and starts a new key.
 */
export const useCommentForm = (requestId: string, scope: CommentScope) => {
  const add = useAddComment(requestId, scope);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const form = useForm<CommentFormValues, unknown, CommentFormOutput>({
    resolver: zodResolver(commentSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { body: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    setErrorCode(null);
    try {
      await add.mutateAsync({ body: values.body, idempotencyKey });
      form.reset({ body: '' });
      setIdempotencyKey(crypto.randomUUID());
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      const detail = error.details.find((item) => item.field === 'body');
      if (detail) {
        form.setError('body', { type: 'server', message: detail.message }, { shouldFocus: true });
      } else {
        setErrorCode(error.code);
      }
    }
  });

  return { form, submit, errorCode, isSubmitting: form.formState.isSubmitting };
};
