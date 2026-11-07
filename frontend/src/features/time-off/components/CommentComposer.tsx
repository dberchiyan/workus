import SendOutlined from '@mui/icons-material/SendOutlined';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';
import { useCommentForm } from '../hooks/useCommentForm';
import { RESERVED_LINE, useFieldMessage } from '../hooks/useFieldMessage';
import type { CommentScope } from '../hooks/useManagedRequests';
import { TIME_OFF_LIMITS } from '../schemas';

export interface CommentComposerProps {
  requestId: string;
  /** The admin's Requests dialog, or the employee's own request. */
  scope: CommentScope;
}

/** Write a comment; Ctrl/⌘ + Enter sends it. Every admin and the employee see it. */
export function CommentComposer({ requestId, scope }: CommentComposerProps) {
  const { t } = useTranslation(['timeOff', 'errors']);
  const message = useFieldMessage();
  const { form, submit, errorCode, isSubmitting } = useCommentForm(requestId, scope);
  const { errors } = form.formState;

  return (
    <form noValidate className="flex flex-col gap-2" onSubmit={(event) => void submit(event)}>
      <TextField
        {...form.register('body')}
        multiline
        minRows={2}
        maxRows={6}
        label={t('manage.comment.label')}
        placeholder={t('manage.comment.placeholder')}
        error={Boolean(errors.body)}
        helperText={message(errors.body, {
          max: TIME_OFF_LIMITS.comment,
          hint: t('manage.comment.hint'),
        })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
        slotProps={{
          input: { className: 'bg-background-paper' },
          htmlInput: { maxLength: TIME_OFF_LIMITS.comment },
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FormHelperText component="div" role="alert" error className="m-0">
          {errorCode ? t(`errors:${errorCode}`) : RESERVED_LINE}
        </FormHelperText>
        <Button
          type="submit"
          variant="outlined"
          size="small"
          startIcon={<SendOutlined aria-hidden />}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? t('manage.comment.sending') : t('manage.comment.send')}
        </Button>
      </div>
    </form>
  );
}
