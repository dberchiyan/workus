import { useTranslation } from 'react-i18next';
import { isEmployeeValidationMessage } from '../schemas';

/** Keeps one helper line under every field, so the form never shifts (data.md → Forms). */
export const RESERVED_LINE = ' ';

/** Client errors carry i18n keys; server field errors arrive already localised. */
export const useFieldMessage = () => {
  const { t } = useTranslation(['employee', 'validation']);
  return (
    error: { type?: string | undefined; message?: string | undefined } | undefined,
    max?: number,
    hint?: string,
  ): string => {
    if (!error?.message) {
      return hint ?? RESERVED_LINE;
    }
    if (error.type === 'server' || !isEmployeeValidationMessage(error.message)) {
      return error.message;
    }
    return t(error.message, max === undefined ? {} : { max });
  };
};
