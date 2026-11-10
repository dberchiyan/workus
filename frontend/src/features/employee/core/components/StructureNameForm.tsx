import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import type { ErrorCode } from '@/shared/types';
import { useFieldMessage } from '../hooks/useFieldMessage';
import {
  STRUCTURE_LIMITS,
  structureNameSchema,
  type StructureNameOutput,
  type StructureNameValues,
} from '../schemas';

export interface StructureNameFormProps {
  kind: 'department' | 'position';
  /** The field's accessible name (and placeholder). */
  label: string;
  defaultValue?: string;
  /** Throws an ApiError when the server refuses; the message lands under the field. */
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
  /** Adding several in a row: after a save the field empties and stays open. */
  keepOpen?: boolean;
  className?: string;
}

/**
 * One name typed in place — a department's or a position's. Enter saves, Escape cancels; errors
 * appear under the field on submit only, on a reserved line, so the list never shifts.
 */
export function StructureNameForm({
  kind,
  label,
  defaultValue = '',
  onSave,
  onCancel,
  keepOpen = false,
  className,
}: StructureNameFormProps) {
  const { t } = useTranslation(['employee', 'errors']);
  const message = useFieldMessage();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const form = useForm<StructureNameValues, unknown, StructureNameOutput>({
    resolver: zodResolver(structureNameSchema(kind)),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { value: defaultValue },
  });
  const { errors, isSubmitting } = form.formState;
  const max =
    kind === 'department' ? STRUCTURE_LIMITS.departmentName : STRUCTURE_LIMITS.positionTitle;

  const submit = form.handleSubmit(async ({ value }) => {
    setErrorCode(null);
    try {
      await onSave(value);
      if (keepOpen) {
        form.reset({ value: '' });
        form.setFocus('value');
      }
    } catch (error) {
      if (!isApiError(error)) {
        throw error;
      }
      const detail = error.details.find((item) => item.field === 'name' || item.field === 'title');
      if (detail) {
        form.setError('value', { type: 'server', message: detail.message }, { shouldFocus: true });
      } else {
        setErrorCode(error.code);
      }
    }
  });

  const { ref, ...field } = form.register('value');
  const helper = errorCode ? t(`errors:${errorCode}`) : message(errors.value, max);

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className={className}>
      <div className="flex items-start gap-1">
        <TextField
          {...field}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              onCancel();
            }
          }}
          inputRef={(element: HTMLInputElement | null) => {
            ref(element);
            // Opened on purpose by the person (Add / Rename): take the focus and select the text.
            if (element && document.activeElement !== element && !element.dataset.focused) {
              element.dataset.focused = 'true';
              element.focus();
              element.select();
            }
          }}
          size="small"
          fullWidth
          placeholder={label}
          error={Boolean(errors.value) || errorCode !== null}
          helperText={helper}
          disabled={isSubmitting}
          slotProps={{
            htmlInput: { 'aria-label': label, autoComplete: 'off', maxLength: max + 20 },
          }}
        />
        <IconButton
          type="submit"
          aria-label={t('structure.save')}
          disabled={isSubmitting}
          className="mt-0.5 text-primary"
        >
          <CheckOutlined fontSize="small" />
        </IconButton>
        <IconButton aria-label={t('structure.cancel')} onClick={onCancel} className="mt-0.5">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </div>
    </form>
  );
}
