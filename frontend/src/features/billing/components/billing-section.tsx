import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { isApiError } from '@/shared/api/api-error';
import { StatusBadge } from '@/shared/components/status-badge';

import { formatBillingDate } from '../format';
import {
    useBilling,
    useChangePlan,
    useOpenPortal,
    useStartCheckout,
    useSyncBilling,
} from '../hooks/use-billing-queries';
import type { Billing, Plan } from '../types';
import { PlanCard } from './plan-card';
import { type PlanChange, PlanChangeDialog } from './plan-change-dialog';

const CHECKOUT_PARAM = 'checkout';
const PLAN_RANK: Record<Plan, number> = { STARTER: 0, TEAM: 1, BUSINESS: 2 };

/** The plan in effect, what happens next and the way to the provider's portal. */
function CurrentPlan({ billing, onKeep }: { billing: Billing; onKeep: () => void }) {
    const { t, i18n } = useTranslation(['billing', 'errors']);
    const portal = useOpenPortal();
    const planName = t(`billing:planNames.${billing.plan}`);
    const date = (iso: string) => formatBillingDate(iso, i18n.language);
    const nextLine = (() => {
        if (billing.status === 'PAST_DUE') {
            return null;
        }
        if (billing.isGrantedPlan) {
            return t('billing:current.granted');
        }
        if (billing.status === 'NONE') {
            return t('billing:current.free');
        }
        if (billing.scheduledPlan && billing.periodEndsAt) {
            return billing.scheduledPlan === 'STARTER'
                ? t('billing:current.endsOn', { date: date(billing.periodEndsAt) })
                : t('billing:current.switchesOn', {
                      plan: t(`billing:planNames.${billing.scheduledPlan}`),
                      date: date(billing.periodEndsAt),
                  });
        }
        return billing.periodEndsAt ? t('billing:current.nextCharge', { date: date(billing.periodEndsAt) }) : null;
    })();
    const statusKey = billing.isGrantedPlan ? 'GRANTED' : billing.status;
    const tone = statusKey === 'PAST_DUE' ? 'danger' : statusKey === 'NONE' ? 'neutral' : 'success';
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <Typography variant="h5" component="p">
                    {planName}
                </Typography>
                <StatusBadge tone={tone} label={t(`billing:status.${statusKey}`)} />
            </div>
            {billing.status === 'PAST_DUE' && billing.graceEndsAt && (
                <Alert severity="error">{t('billing:current.pastDue', { date: date(billing.graceEndsAt) })}</Alert>
            )}
            {nextLine && (
                <Typography variant="body2" color="textSecondary">
                    {nextLine}
                </Typography>
            )}
            {billing.scheduledPlan !== null && billing.status !== 'NONE' && (
                <div>
                    <Button variant="contained" onClick={onKeep}>
                        {t('billing:current.keep', { plan: planName })}
                    </Button>
                </div>
            )}
            {billing.hasBillingAccount && (
                <div className="flex flex-col gap-2">
                    <div>
                        <Button
                            variant="outlined"
                            loading={portal.isPending}
                            onClick={() => {
                                portal.mutate();
                            }}
                        >
                            {t('billing:current.manage')}
                        </Button>
                    </div>
                    <Typography variant="caption" color="textSecondary">
                        {t('billing:current.manageHint')}
                    </Typography>
                    {portal.isError && (
                        <Alert severity="error" role="alert">
                            {t(`errors:${portal.error.code}`)}
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );
}

/** Settings → Billing (owners): the current plan, the pricing table, and the portal. */
export function BillingSection(): ReactElement {
    const { t, i18n } = useTranslation(['billing', 'errors']);
    const titleId = useId();
    const plansId = useId();
    const billing = useBilling();
    const checkout = useStartCheckout();
    const sync = useSyncBilling();
    const changePlan = useChangePlan();
    const [change, setChange] = useState<PlanChange | null>(null);
    const [changeOpen, setChangeOpen] = useState(false);
    const [changeNotice, setChangeNotice] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const checkoutResult = searchParams.get(CHECKOUT_PARAM);
    const checkoutKey = useRef(crypto.randomUUID());
    const synced = useRef(false);
    const clearCheckoutParam = (): void => {
        setSearchParams(
            (current) => {
                current.delete(CHECKOUT_PARAM);
                return current;
            },
            { replace: true },
        );
    };

    const { mutate: runSync } = sync;
    useEffect(() => {
        if (checkoutResult !== 'success' || synced.current) {
            return;
        }
        synced.current = true;
        runSync(undefined, { onSuccess: clearCheckoutParam });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkoutResult, runSync]);

    const notice =
        checkoutResult === 'canceled'
            ? t('billing:notice.canceled')
            : sync.isSuccess
              ? t('billing:notice.upgraded', { plan: t(`billing:planNames.${sync.data.plan}`) })
              : changeNotice;
    const dismissNotice = (): void => {
        if (checkoutResult === 'canceled') {
            clearCheckoutParam();
        } else if (sync.isSuccess) {
            sync.reset();
        } else {
            setChangeNotice(null);
        }
    };

    /** Opens the review step for a change of plan. */
    const review = (next: PlanChange): void => {
        changePlan.reset();
        setChangeNotice(null);
        setChange(next);
        setChangeOpen(true);
    };
    const confirmChange = (): void => {
        if (!change) {
            return;
        }
        const names = {
            plan: t(`billing:planNames.${change.kind === 'keep' ? change.current : change.target}`),
            date: change.periodEndsAt ? formatBillingDate(change.periodEndsAt, i18n.language) : '',
        };
        changePlan.mutate(
            { plan: change.kind === 'keep' ? change.current : change.target },
            {
                onSuccess: () => {
                    setChangeOpen(false);
                    setChangeNotice(t(`billing:change.done.${change.kind}`, names));
                },
            },
        );
    };

    /** The button a plan card gets, given the company's state (the API decides the same way). */
    const actionFor = (offer: Billing['plans'][number], data: Billing) => {
        const isCurrent = offer.plan === data.plan;
        const hasSubscription = data.status !== 'NONE';
        const open = (kind: PlanChange['kind']) => () => {
            review({ kind, target: offer.plan, current: data.plan, periodEndsAt: data.periodEndsAt });
        };
        const pending = (plan: Plan) =>
            changePlan.isPending && change !== null && change.target === plan && change.kind !== 'keep';
        if (isCurrent) {
            return undefined;
        }
        if (!hasSubscription) {
            if (offer.plan === 'STARTER') {
                return {
                    label: t('billing:plans.switchToStarter'),
                    onClick: open('giveUp'),
                    loading: pending(offer.plan),
                };
            }
            return {
                label: t(
                    PLAN_RANK[offer.plan] > PLAN_RANK[data.plan] ? 'billing:plans.upgradeTo' : 'billing:plans.chooseTo',
                    { plan: offer.name },
                ),
                onClick: () => {
                    startCheckout(offer.plan);
                },
                loading: checkout.isPending && checkout.variables.request.plan === offer.plan,
            };
        }
        const isUpgrade = PLAN_RANK[offer.plan] > PLAN_RANK[data.plan];
        return {
            label: t(isUpgrade ? 'billing:plans.upgradeTo' : 'billing:plans.downgradeTo', {
                plan: offer.name,
            }),
            onClick: open(isUpgrade ? 'upgrade' : 'downgrade'),
            loading: pending(offer.plan),
        };
    };

    const data = billing.data;
    const startCheckout = (plan: Plan): void => {
        if (plan === 'STARTER') {
            return;
        }
        checkout.mutate({ request: { plan }, idempotencyKey: checkoutKey.current });
    };
    const errorCode = checkout.isError ? checkout.error.code : sync.isError ? sync.error.code : null;

    return (
        <div className="flex flex-col gap-6">
            <Card component="section" aria-labelledby={titleId} className="flex flex-col">
                <div className="flex flex-col gap-0.5 border-b border-divider px-4 py-4 sm:px-6">
                    <Typography id={titleId} variant="h6" component="h2">
                        {t('billing:current.title')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {t('billing:current.description')}
                    </Typography>
                </div>
                <div className="p-4 sm:p-6">
                    {billing.isError ? (
                        <Alert
                            severity="error"
                            action={
                                <Button color="inherit" size="small" onClick={() => void billing.refetch()}>
                                    {t('billing:retry')}
                                </Button>
                            }
                        >
                            {t(`errors:${isApiError(billing.error) ? billing.error.code : 'INTERNAL_ERROR'}`)}
                        </Alert>
                    ) : data ? (
                        <CurrentPlan
                            billing={data}
                            onKeep={() => {
                                review({
                                    kind: 'keep',
                                    target: data.plan,
                                    current: data.plan,
                                    periodEndsAt: data.periodEndsAt,
                                });
                            }}
                        />
                    ) : (
                        <div aria-busy="true" className="flex max-w-md flex-col gap-3">
                            <span className="sr-only">{t('billing:loading')}</span>
                            <Skeleton variant="text" width={160} height={36} />
                            <Skeleton variant="text" width={240} />
                        </div>
                    )}
                </div>
            </Card>
            {data && (
                <section aria-labelledby={plansId} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-0.5">
                        <Typography id={plansId} variant="h6" component="h2">
                            {t('billing:plans.title')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {data.status === 'NONE'
                                ? t('billing:plans.description')
                                : t('billing:plans.descriptionSubscribed')}
                        </Typography>
                    </div>
                    {data.isTestMode && (
                        <Alert severity="info">
                            <Typography variant="subtitle2" component="span">
                                {t('billing:testMode.title')}
                            </Typography>{' '}
                            {t('billing:testMode.card')}
                        </Alert>
                    )}
                    {errorCode && (
                        <Alert severity="error" role="alert">
                            {t(`errors:${errorCode}`)}
                        </Alert>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {data.plans.map((offer) => (
                            <PlanCard
                                key={offer.plan}
                                offer={offer}
                                isCurrent={offer.plan === data.plan}
                                isScheduled={data.status !== 'NONE' && offer.plan === data.scheduledPlan}
                                action={actionFor(offer, data)}
                            />
                        ))}
                    </div>
                    <Typography variant="caption" color="textSecondary">
                        {t('billing:plans.terms')}
                    </Typography>
                </section>
            )}
            <PlanChangeDialog
                change={change}
                open={changeOpen}
                loading={changePlan.isPending}
                errorCode={changePlan.isError ? changePlan.error.code : null}
                onConfirm={confirmChange}
                onClose={() => {
                    setChangeOpen(false);
                }}
                onExited={() => {
                    setChange(null);
                }}
            />
            <Snackbar
                open={notice !== null}
                onClose={(_event, reason) => {
                    if (reason !== 'clickaway') {
                        dismissNotice();
                    }
                }}
                message={notice ?? ''}
                action={
                    <Button color="inherit" size="small" onClick={dismissNotice}>
                        {t('billing:notice.dismiss')}
                    </Button>
                }
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                slotProps={{ content: { role: 'status' } }}
            />
            <span className="sr-only" aria-live="polite">
                {sync.isPending ? t('billing:loading') : ''}
            </span>
        </div>
    );
}
