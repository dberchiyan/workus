import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { formatDateTime, fullName } from '../format';
import { useDeleteComment, useEditComment } from '../hooks/useManagedRequests';
import { TIME_OFF_LIMITS } from '../schemas';
import type { TimeOffComment } from '../types';

export interface CommentItemProps {
  requestId: string;
  comment: TimeOffComment;
  /** The signed-in user: their own comments can be edited and deleted. */
  viewerId: string | undefined;
}

/** One comment; its author edits it in place or deletes it (after a confirmation). */
export function CommentItem({ requestId, comment, viewerId }: CommentItemProps) {
  const { t, i18n } = useTranslation(['timeOff', 'errors', 'validation']);
  const own = comment.author.id === viewerId;
  const edit = useEditComment(requestId);
  const remove = useDeleteComment(requestId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (editing) {
      fieldRef.current?.focus();
    }
  }, [editing]);
  useEffect(() => {
    if (confirming) {
      requestAnimationFrame(() => {
        keepRef.current?.focus();
      });
    }
  }, [confirming]);

  const failure = (caught: unknown): string => {
    if (!isApiError(caught)) {
      throw caught;
    }
    return (
      caught.details.find((item) => item.field === 'body')?.message ?? t(`errors:${caught.code}`)
    );
  };

  const save = async () => {
    const body = draft.trim();
    if (body.length === 0) {
      setError(t('validation:timeOffComment.required'));
      return;
    }
    if (body.length > TIME_OFF_LIMITS.comment) {
      setError(t('validation:timeOffComment.tooLong', { max: TIME_OFF_LIMITS.comment }));
      return;
    }
    try {
      await edit.mutateAsync({ commentId: comment.id, body });
      setEditing(false);
      requestAnimationFrame(() => editRef.current?.focus());
    } catch (caught) {
      setError(failure(caught));
    }
  };

  return (
    <div className="flex gap-3">
      <InitialsAvatar
        id={comment.author.id}
        firstName={comment.author.firstName}
        lastName={comment.author.lastName}
        size="sm"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg bg-background px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-2">
          <Typography variant="subtitle2" component="span">
            {fullName(comment.author)}
          </Typography>
          <span className="flex items-center gap-1">
            <Typography variant="caption" color="textSecondary" className="app-tabular">
              <time dateTime={comment.createdAt}>
                {formatDateTime(comment.createdAt, i18n.language)}
              </time>
              {comment.editedAt && ` · ${t('comments.edited')}`}
            </Typography>
            {own && !editing && (
              <>
                <Tooltip title={t('comments.edit')}>
                  <IconButton
                    ref={editRef}
                    size="small"
                    aria-label={t('comments.edit')}
                    onClick={() => {
                      setDraft(comment.body);
                      setError(null);
                      setEditing(true);
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('comments.delete')}>
                  <IconButton
                    size="small"
                    aria-label={t('comments.delete')}
                    onClick={() => {
                      setError(null);
                      setConfirming(true);
                    }}
                  >
                    <DeleteOutlineOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </span>
        </div>
        {editing ? (
          <form
            noValidate
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <TextField
              inputRef={fieldRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setEditing(false);
                } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void save();
                }
              }}
              multiline
              minRows={2}
              maxRows={6}
              size="small"
              label={t('comments.editLabel')}
              error={error !== null}
              helperText={error ?? t('manage.comment.hint')}
              slotProps={{
                input: { className: 'bg-background-paper' },
                htmlInput: { maxLength: TIME_OFF_LIMITS.comment },
              }}
            />
            <span className="flex justify-end gap-2">
              <Button
                size="small"
                onClick={() => {
                  setEditing(false);
                }}
                disabled={edit.isPending}
              >
                {t('comments.cancel')}
              </Button>
              <Button type="submit" size="small" variant="contained" loading={edit.isPending}>
                {t('comments.save')}
              </Button>
            </span>
          </form>
        ) : (
          <Typography variant="body2" className="[overflow-wrap:anywhere] whitespace-pre-line">
            {comment.body}
          </Typography>
        )}
      </div>
      <Dialog
        open={confirming}
        onClose={() => {
          if (!remove.isPending) {
            setConfirming(false);
          }
        }}
        maxWidth="xs"
        fullWidth
        aria-labelledby={titleId}
      >
        <DialogTitle id={titleId}>{t('comments.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('comments.deleteText')}</DialogContentText>
          {error && (
            <Typography role="alert" variant="body2" color="error" className="mt-2">
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions className="px-4 py-3 sm:px-6">
          <Button
            ref={keepRef}
            onClick={() => {
              setConfirming(false);
            }}
            disabled={remove.isPending}
          >
            {t('comments.keep')}
          </Button>
          <Button
            variant="contained"
            color="error"
            loading={remove.isPending}
            onClick={() => {
              remove.mutate(comment.id, {
                onError: (caught) => {
                  setError(failure(caught));
                },
              });
            }}
          >
            {t('comments.deleteConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
