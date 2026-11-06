import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { formatMoney } from '@/shared/lib/money';
import { formatReviewDate } from '../format';
import type { Review } from '../types';
import { ReviewStatusChip } from './ReviewStatusChip';
import { ViewFeedbackTabs } from './ViewFeedbackTabs';

export interface ReviewViewDialogProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
  onExited: () => void;
}

/** Read-only review with everything at once, plus Edit and Delete. */
export function ReviewViewDialog({
  review,
  open,
  onClose,
  onEdit,
  onDelete,
  onExited,
}: ReviewViewDialogProps) {
  const { t, i18n } = useTranslation('review');
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  if (!review) {
    return null;
  }
  const rows = [
    { key: 'date', label: t('view.date'), value: formatReviewDate(review.date, i18n.language) },
    { key: 'status', label: t('view.status'), value: <ReviewStatusChip status={review.status} /> },
    {
      key: 'salary',
      label: t('view.salary'),
      value: review.salary ? formatMoney(review.salary, i18n.language) : t('list.noSalary'),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isPhone}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId} className="[overflow-wrap:anywhere]">
        {review.title}
      </DialogTitle>
      <DialogContent dividers className="flex flex-col gap-5">
        <dl className="m-0 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3">
          {rows.map((row) => (
            <div key={row.key} className="contents">
              <Typography variant="body2" component="dt" color="textSecondary">
                {row.label}
              </Typography>
              <Typography variant="body2" component="dd" className="app-tabular m-0">
                {row.value}
              </Typography>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2">
          <Typography variant="subtitle2" component="h3">
            {t('view.responsible')}
          </Typography>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            {review.responsibles.map((person) => (
              <li key={person.id} className="flex items-center gap-2">
                <InitialsAvatar
                  id={person.id}
                  firstName={person.firstName}
                  lastName={person.lastName}
                  size="sm"
                />
                <Typography
                  variant="body2"
                  component="span"
                >{`${person.firstName} ${person.lastName}`}</Typography>
              </li>
            ))}
          </ul>
        </div>
        <ViewFeedbackTabs review={review} />
      </DialogContent>
      <DialogActions className="flex-wrap gap-2 px-4 py-3 sm:px-6">
        <Button
          color="error"
          onClick={() => {
            onDelete(review);
          }}
          className="mr-auto"
        >
          {t('view.delete')}
        </Button>
        <Button onClick={onClose}>{t('view.close')}</Button>
        <Button
          variant="contained"
          onClick={() => {
            onEdit(review);
          }}
        >
          {t('view.edit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
