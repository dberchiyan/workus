import AddOutlined from '@mui/icons-material/AddOutlined';
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import { useEmployeeReviews } from '../hooks/useReviewQueries';
import type { Review } from '../types';
import { DeleteReviewDialog } from './DeleteReviewDialog';
import { ReviewFormDialog } from './ReviewFormDialog';
import { ReviewCardList } from './ReviewCardList';
import type { ReviewAction } from './ReviewRowActions';
import { ReviewTable } from './ReviewTable';
import { ReviewViewDialog } from './ReviewViewDialog';
import { SalaryOverview } from './SalaryOverview';

type DialogState =
  | { kind: 'none' }
  | { kind: 'form'; review: Review | null }
  | { kind: 'view'; review: Review }
  | { kind: 'delete'; review: Review };

export interface ReviewTabProps {
  employeeId: string;
}

/** Salary overview on top, then the reviews (newest first); add, view, edit and delete. */
export function ReviewTab({ employeeId }: ReviewTabProps) {
  const { t } = useTranslation(['review', 'errors']);
  const { data, isPending, isError, error, refetch } = useEmployeeReviews(employeeId);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  // The last shown review stays mounted during the closing transition.
  const [lastReview, setLastReview] = useState<Review | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // A fresh form (values, Idempotency-Key, errors) for every opening.
  const [formKey, setFormKey] = useState(0);
  // Kept through the closing transition, so the title doesn't flip from Edit to Add.
  const [formReview, setFormReview] = useState<Review | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = (next: DialogState, trigger: HTMLElement | null): void => {
    if (next.kind !== 'none' && next.review) {
      setLastReview(next.review);
    }
    if (trigger) {
      triggerRef.current = trigger;
    }
    setNotice(null);
    if (next.kind === 'form') {
      setFormKey((key) => key + 1);
      setFormReview(next.review);
    }
    setDialog(next);
  };
  const close = (): void => {
    setDialog({ kind: 'none' });
  };
  // Dialog closed → focus back to what opened it (ux.md → Focus moves with the UI).
  const restoreFocus = (): void => {
    const trigger = triggerRef.current;
    (trigger?.isConnected ? trigger : addButtonRef.current)?.focus();
  };
  const onAction = (action: ReviewAction, review: Review, trigger: HTMLElement | null): void => {
    open(
      action === 'view'
        ? { kind: 'view', review }
        : action === 'edit'
          ? { kind: 'form', review }
          : { kind: 'delete', review },
      trigger,
    );
  };

  if (isPending) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-3 p-4 sm:p-6">
        <span className="sr-only">{t('tab.loading')}</span>
        <Skeleton variant="rounded" className="h-24" />
        <Skeleton variant="rounded" className="h-16" />
        <Skeleton variant="rounded" className="h-16" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <Alert
          severity="error"
          role="alert"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              {t('list.retry')}
            </Button>
          }
        >
          {t(`errors:${isApiError(error) ? error.code : 'INTERNAL_ERROR'}`)}
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SalaryOverview salary={data.salary} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider px-4 py-3 sm:px-6">
        <Typography variant="h6" component="h3">
          {t('list.title')}
        </Typography>
        <Button
          ref={addButtonRef}
          variant="outlined"
          startIcon={<AddOutlined aria-hidden />}
          onClick={(event) => {
            open({ kind: 'form', review: null }, event.currentTarget);
          }}
        >
          {t('add.open')}
        </Button>
      </div>
      {data.content.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <RateReviewOutlined aria-hidden fontSize="large" className="text-text-disabled" />
          <Typography variant="h6" component="p">
            {t('list.empty')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('list.emptyHint')}
          </Typography>
        </div>
      ) : (
        // The tab card's own width decides (container query), not the viewport: the card is
        // narrower on a 1200 px desktop with the side column than on a 1024 px tablet without it.
        // 44rem: the narrowest width where the fixed Date/Status/Salary columns plus room for
        // Title and Responsible fit.
        <div className="@container">
          <div className="hidden @[44rem]:block">
            <ReviewTable reviews={data.content} onAction={onAction} />
          </div>
          <div className="@[44rem]:hidden">
            <ReviewCardList reviews={data.content} onAction={onAction} />
          </div>
        </div>
      )}
      <ReviewFormDialog
        key={formKey}
        employeeId={employeeId}
        review={formReview}
        open={dialog.kind === 'form'}
        onClose={close}
        onSaved={(review) => {
          close();
          setNotice(
            formReview
              ? t('edit.saved', { title: review.title })
              : t('add.created', { title: review.title }),
          );
        }}
        onExited={restoreFocus}
      />
      <ReviewViewDialog
        review={dialog.kind === 'view' ? dialog.review : lastReview}
        open={dialog.kind === 'view'}
        onClose={close}
        onEdit={(review) => {
          open({ kind: 'form', review }, null);
        }}
        onDelete={(review) => {
          open({ kind: 'delete', review }, null);
        }}
        onExited={() => {
          if (dialog.kind === 'none') {
            restoreFocus();
          }
        }}
      />
      <DeleteReviewDialog
        employeeId={employeeId}
        review={dialog.kind === 'delete' ? dialog.review : lastReview}
        open={dialog.kind === 'delete'}
        onClose={close}
        onDeleted={(review) => {
          close();
          setNotice(t('delete.deleted', { title: review.title }));
          // The deleted row's menu button is gone; focus goes to "Add review".
          triggerRef.current = addButtonRef.current;
        }}
        onExited={restoreFocus}
      />
      <Snackbar
        open={notice !== null}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') {
            setNotice(null);
          }
        }}
        message={notice ?? ''}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              setNotice(null);
            }}
          >
            {t('add.dismiss')}
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ content: { role: 'status' } }}
      />
    </div>
  );
}
