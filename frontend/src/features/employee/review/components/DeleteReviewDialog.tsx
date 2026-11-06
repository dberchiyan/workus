import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import { formatMoney } from '@/shared/lib/money';
import type { ErrorCode } from '@/shared/types';
import { formatReviewDate } from '../format';
import { useDeleteReview } from '../hooks/useReviewQueries';
import type { Review } from '../types';

export interface DeleteReviewDialogProps {
  employeeId: string;
  review: Review | null;
  open: boolean;
  onClose: () => void;
  onDeleted: (review: Review) => void;
  onExited: () => void;
}

/** Says exactly what will happen, and the button says it too (data.md → Money and sensitive data). */
export function DeleteReviewDialog({
  employeeId,
  review,
  open,
  onClose,
  onDeleted,
  onExited,
}: DeleteReviewDialogProps) {
  const { t, i18n } = useTranslation(['review', 'errors']);
  const titleId = useId();
  const descriptionId = useId();
  const remove = useDeleteReview(employeeId);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Irreversible action: the safe choice gets the initial focus.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  const dismiss = (): void => {
    setErrorCode(null);
    onClose();
  };

  if (!review) {
    return null;
  }
  const isCompletedWithSalary = review.status === 'COMPLETED' && review.salary !== null;

  const confirm = async (): Promise<void> => {
    setErrorCode(null);
    try {
      await remove.mutateAsync(review.id);
      onDeleted(review);
    } catch (error) {
      setErrorCode(isApiError(error) ? error.code : 'INTERNAL_ERROR');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={remove.isPending ? undefined : dismiss}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{t('delete.title')}</DialogTitle>
      <DialogContent id={descriptionId} className="flex flex-col gap-2">
        <Typography variant="body1" className="[overflow-wrap:anywhere]">
          {t('delete.body', {
            title: review.title,
            date: formatReviewDate(review.date, i18n.language),
          })}
        </Typography>
        {isCompletedWithSalary && review.salary && (
          <Typography variant="body2" color="textSecondary">
            {t('delete.salaryNote', { salary: formatMoney(review.salary, i18n.language) })}
          </Typography>
        )}
        {errorCode && (
          <FormHelperText error role="alert" className="m-0">
            {t(`errors:${errorCode}`)}
          </FormHelperText>
        )}
      </DialogContent>
      <DialogActions className="px-4 py-3 sm:px-6">
        <Button ref={cancelRef} onClick={dismiss} disabled={remove.isPending}>
          {t('delete.cancel')}
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => void confirm()}
          disabled={remove.isPending}
          aria-busy={remove.isPending}
        >
          {remove.isPending ? t('delete.deleting') : t('delete.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
