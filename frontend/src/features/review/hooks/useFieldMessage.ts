import { useTranslation } from 'react-i18next';
import { isReviewValidationMessage } from '../schemas';

/** Keeps one helper line under every field, so the form never shifts (data.md → Forms). */
export const RESERVED_LINE = ' ';

export const useFieldMessage = () => {
  const { t } = useTranslation(['review', 'validation']);
  return (
    error: { type?: string | undefined; message?: string | undefined } | undefined,
    max?: number,
    hint?: string,
  ): string => {
    if (!error?.message) {
      return hint ?? RESERVED_LINE;
    }
    if (error.type === 'server' || !isReviewValidationMessage(error.message)) {
      return error.message;
    }
    return t(error.message, max === undefined ? {} : { max });
  };
};
