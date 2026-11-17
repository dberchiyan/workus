import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { domAnimation, LazyMotion } from 'motion/react';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUpgrade } from '@/features/auth';
import { UpgradePrompt } from '@/shared/components/upgrade-prompt';
import { useDocumentTitle } from '@/shared/hooks/use-document-title';
import { usePageHeadingFocus } from '@/shared/hooks/use-page-heading-focus';
import { nowUtc } from '@/shared/lib/utc-day';

import { seriesClass } from '../chart';
import { AbsenceSection } from '../components/absence-section';
import { HeadcountSection } from '../components/headcount-section';
import { InsightsToolbar } from '../components/insights-toolbar';
import { SalarySection } from '../components/salary-section';
import { TenureSection } from '../components/tenure-section';
import { TurnoverSection } from '../components/turnover-section';
import { useInsightCategories } from '../hooks/use-insights';
import { useInsightsParams } from '../hooks/use-insights-params';

/** Company figures for a year (admin): headcount, turnover, tenure, absence, salary. */
export function InsightsPage(): ReactElement {
    const { t } = useTranslation('insights');
    useDocumentTitle(t('pageTitle'));
    const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
    const [now] = useState(nowUtc);
    const { filter, update } = useInsightsParams(now.year);
    const filterKey = `${String(filter.year)}-${filter.categoryId ?? 'all'}`;
    const upgrade = useUpgrade('insights');
    const categoryData = useInsightCategories(!upgrade.locked).data;
    const categories = useMemo(() => categoryData?.categories ?? [], [categoryData]);

    const colorFor = useCallback(
        (groupId: string, index: number) => {
            const place = categories.findIndex((category) => category.id === groupId);
            return seriesClass(place >= 0 ? place : index);
        },
        [categories],
    );

    if (upgrade.locked) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <Typography ref={headingRef} tabIndex={-1} variant="h4" component="h1" className="outline-none">
                        {t('title')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {t('subtitle')}
                    </Typography>
                </div>
                <Card variant="outlined">
                    <UpgradePrompt
                        reason={{ kind: 'feature', feature: 'insights' }}
                        requiredPlan={upgrade.requiredPlan}
                        hasBillingAccount={upgrade.hasBillingAccount}
                    />
                </Card>
            </div>
        );
    }

    return (
        <LazyMotion features={domAnimation} strict>
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <Typography ref={headingRef} tabIndex={-1} variant="h4" component="h1" className="outline-none">
                            {t('title')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {t('subtitle')}
                        </Typography>
                    </div>
                    <InsightsToolbar filter={filter} currentYear={now.year} categories={categories} onChange={update} />
                </div>
                <HeadcountSection key={`headcount-${filterKey}`} filter={filter} colorFor={colorFor} />
                <TurnoverSection key={`turnover-${filterKey}`} filter={filter} now={now} />
                <TenureSection filter={filter} colorFor={colorFor} />
                <AbsenceSection filter={filter} />
                <SalarySection filter={filter} />
            </div>
        </LazyMotion>
    );
}
