import AddOutlined from '@mui/icons-material/AddOutlined';
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isApiError } from '@/shared/api/api-error';

import { useEmployeeReviews } from '../hooks/use-review-queries';
import type { Review } from '../types';
import { DeleteReviewDialog } from './delete-review-dialog';
import { ReviewCardList } from './review-card-list';
import { ReviewFormDialog } from './review-form-dialog';
import type { ReviewAction } from './review-row-actions';
import { ReviewTable } from './review-table';
import { ReviewViewDialog } from './review-view-dialog';
import { SalaryOverview } from './salary-overview';

type DialogState =
    | { kind: 'none' }
    | { kind: 'form'; review: Review | null }
    | { kind: 'view'; review: Review }
    | { kind: 'delete'; review: Review };

export interface ReviewTabProps {
    employeeId: string;
}

const REVIEWS_PAGE_SIZE = 10;

/** Salary overview on top, then the reviews (newest first, ten a page); add, view, edit and delete. */
export function ReviewTab({ employeeId }: ReviewTabProps): ReactElement {
    const { t, i18n } = useTranslation(['review', 'errors']);
    const { data, isPending, isError, error, refetch } = useEmployeeReviews(employeeId);
    const [page, setPage] = useState(0);
    const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
    const [lastReview, setLastReview] = useState<Review | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [formKey, setFormKey] = useState(0);
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

    const pages = Math.ceil(data.content.length / REVIEWS_PAGE_SIZE);
    const current = Math.max(0, Math.min(page, pages - 1));
    const shown = data.content.slice(current * REVIEWS_PAGE_SIZE, (current + 1) * REVIEWS_PAGE_SIZE);
    const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);

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
                <div className="@container">
                    <div className="hidden @[44rem]:block">
                        <ReviewTable reviews={shown} onAction={onAction} />
                    </div>
                    <div className="@[44rem]:hidden">
                        <ReviewCardList reviews={shown} onAction={onAction} />
                    </div>
                </div>
            )}
            {pages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider px-4 py-3 sm:px-6">
                    <Typography variant="caption" color="textSecondary" className="app-tabular">
                        {t('list.range', {
                            from: number(current * REVIEWS_PAGE_SIZE + 1),
                            to: number(current * REVIEWS_PAGE_SIZE + shown.length),
                            count: number(data.content.length),
                        })}
                    </Typography>
                    <Pagination
                        shape="rounded"
                        color="primary"
                        count={pages}
                        page={current + 1}
                        siblingCount={0}
                        aria-label={t('list.pages')}
                        onChange={(_event, value) => {
                            setPage(value - 1);
                        }}
                    />
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
                    if (!formReview) {
                        setPage(0);
                    }
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
