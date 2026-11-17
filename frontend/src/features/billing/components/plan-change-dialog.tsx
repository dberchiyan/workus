import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { ErrorCode } from '@/shared/types';
import type { Plan } from '../types';

/** What the owner is about to do with the plan. */
export type PlanChangeKind = 'upgrade' | 'downgrade' | 'giveUp' | 'keep';

export interface PlanChange {
    kind: PlanChangeKind;
    /** The plan the request names (Starter for ending the subscription). */
    target: Plan;
    current: Plan;
    /** The period end (ISO instant), when the change applies then. */
    periodEndsAt: string | null;
}

export interface PlanChangeDialogProps {
    change: PlanChange | null;
    open: boolean;
    loading: boolean;
    errorCode: ErrorCode | null;
    onConfirm: () => void;
    onClose: () => void;
    onExited: () => void;
}

/** A plan as a small pill: the one left behind muted, the one chosen in the brand tint. */
function PlanPill({ name, active }: { name: string; active: boolean }) {
    return (
        <Typography
            variant="subtitle2"
            component="span"
            className={cn(
                'rounded-full px-2.5 py-0.5 whitespace-nowrap',
                active
                    ? 'bg-badge-active-background text-badge-active-text'
                    : 'bg-badge-neutral-background text-text-secondary',
            )}
        >
            {name}
        </Typography>
    );
}

/**
 * The review step before a plan change (data.md → money-moving forms): from → to with when it
 * applies, one sentence on the consequence, the confirm button naming the action, the safe
 * choice focused first.
 */
export function PlanChangeDialog({
    change,
    open,
    loading,
    errorCode,
    onConfirm,
    onClose,
    onExited,
}: PlanChangeDialogProps) {
    const { t, i18n } = useTranslation(['billing', 'errors']);
    const titleId = useId();
    const descriptionId = useId();
    const cancelRef = useRef<HTMLButtonElement>(null);
    // Money-moving or irreversible: the safe choice gets the initial focus.
    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => {
                cancelRef.current?.focus();
            });
        }
    }, [open]);
    if (!change) {
        return null;
    }
    const { kind } = change;
    const target = kind === 'keep' ? change.current : change.target;
    const names = {
        plan: t(`billing:planNames.${target}`),
        current: t(`billing:planNames.${change.current}`),
    };
    const date = change.periodEndsAt
        ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeZone: 'UTC' }).format(
              new Date(change.periodEndsAt),
          )
        : null;
    // When it applies: now (an upgrade, giving a plan up), or at the period end.
    const when =
        kind === 'downgrade' && date
            ? t('billing:change.when.onDate', { date })
            : kind === 'upgrade'
              ? t('billing:change.when.chargedNow')
              : kind === 'giveUp'
                ? t('billing:change.when.now')
                : null;
    const isDestructive = kind === 'giveUp' || (kind === 'downgrade' && target === 'STARTER');

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            slotProps={{ transition: { onExited } }}
        >
            <DialogTitle id={titleId}>{t(`billing:change.${kind}.title`, names)}</DialogTitle>
            <DialogContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 rounded-md bg-background px-3 py-2.5">
                    {kind === 'keep' ? (
                        <PlanPill name={names.current} active />
                    ) : (
                        <>
                            <PlanPill name={names.current} active={false} />
                            <ArrowForwardOutlined aria-hidden fontSize="small" className="text-text-secondary" />
                            <PlanPill name={names.plan} active />
                        </>
                    )}
                    {when && (
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            className="app-tabular ml-auto whitespace-nowrap"
                        >
                            {when}
                        </Typography>
                    )}
                </div>
                <DialogContentText id={descriptionId} variant="body2">
                    {t(`billing:change.${kind}.text`, names)}
                </DialogContentText>
                {errorCode && (
                    <Alert severity="error" role="alert">
                        {t(`errors:${errorCode}`)}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions className="px-4 pb-4 sm:px-6">
                <Button ref={cancelRef} onClick={onClose} disabled={loading}>
                    {t('billing:change.cancel')}
                </Button>
                <Button
                    variant="contained"
                    color={isDestructive ? 'error' : 'primary'}
                    loading={loading}
                    onClick={onConfirm}
                    className="whitespace-nowrap"
                >
                    {t(`billing:change.${kind}.confirm`, names)}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
