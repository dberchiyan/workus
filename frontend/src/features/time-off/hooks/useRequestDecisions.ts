import { useState } from 'react';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import type { ManagedRequest, TimeOffDecision } from '../types';
import { useDecideRequest } from './useManagedRequests';

export interface DecisionNotice {
  decision: TimeOffDecision;
  request: ManagedRequest;
}

type Confirmable = { request: ManagedRequest; decision: 'reject' | 'cancel' };

/**
 * Approve runs at once (it is what the request asks for); reject (with an optional reason) and
 * cancel are confirmed first. A failed approve is announced; a failed confirmation shows in its dialog.
 */
export const useRequestDecisions = () => {
  const decide = useDecideRequest();
  const [confirming, setConfirming] = useState<(Confirmable & { open: boolean }) | null>(null);
  const [confirmError, setConfirmError] = useState<ErrorCode | null>(null);
  const [notice, setNotice] = useState<DecisionNotice | null>(null);
  const [failure, setFailure] = useState<ErrorCode | null>(null);

  const run = async (
    request: ManagedRequest,
    decision: TimeOffDecision,
    comment?: string,
  ): Promise<boolean> => {
    try {
      const updated = await decide.mutateAsync({
        requestId: request.id,
        decision,
        ...(comment ? { comment } : {}),
      });
      setNotice({ decision, request: updated });
      return true;
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      if (decision === 'approve') {
        setFailure(error.code);
      } else {
        setConfirmError(error.code);
      }
      return false;
    }
  };

  const start = (request: ManagedRequest, decision: TimeOffDecision): void => {
    setNotice(null);
    setFailure(null);
    if (decision === 'approve') {
      void run(request, decision);
      return;
    }
    setConfirmError(null);
    setConfirming({ request, decision, open: true });
  };

  const closeConfirm = (): void => {
    setConfirming((current) => (current ? { ...current, open: false } : null));
  };

  /** `comment`: why it is rejected (optional; rejections only). */
  const confirm = async (comment?: string): Promise<void> => {
    if (confirming && (await run(confirming.request, confirming.decision, comment))) {
      closeConfirm();
    }
  };

  return {
    start,
    busyId: decide.isPending ? decide.variables.requestId : null,
    isPending: decide.isPending,
    confirming,
    confirmError,
    confirm: (comment?: string) => void confirm(comment),
    closeConfirm,
    clearConfirm: () => {
      setConfirming(null);
    },
    notice,
    failure,
    dismiss: () => {
      setNotice(null);
      setFailure(null);
    },
  };
};
