import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import type { Review } from '../types';

export type ReviewAction = 'view' | 'edit' | 'delete';
export type OnReviewAction = (
  action: ReviewAction,
  review: Review,
  trigger: HTMLElement | null,
) => void;

/** Icon buttons named after the review, so a screen reader says which one. */
export function ReviewEditButton({
  review,
  onAction,
}: {
  review: Review;
  onAction: OnReviewAction;
}) {
  const { t } = useTranslation('review');
  const label = t('actions.editNamed', { title: review.title });
  return (
    <Tooltip title={t('actions.edit')}>
      <IconButton
        aria-label={label}
        onClick={(event) => {
          onAction('edit', review, event.currentTarget);
        }}
      >
        <EditOutlined aria-hidden fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

export function ReviewDeleteButton({
  review,
  onAction,
}: {
  review: Review;
  onAction: OnReviewAction;
}) {
  const { t } = useTranslation('review');
  const label = t('actions.deleteNamed', { title: review.title });
  return (
    <Tooltip title={t('actions.delete')}>
      <IconButton
        aria-label={label}
        onClick={(event) => {
          onAction('delete', review, event.currentTarget);
        }}
        className="text-error"
      >
        <DeleteOutlineOutlined aria-hidden fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
