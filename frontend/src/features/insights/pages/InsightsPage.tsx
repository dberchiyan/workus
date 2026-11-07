import Typography from '@mui/material/Typography';
import { domAnimation, LazyMotion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { nowUtc } from '@/shared/lib/utcDay';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { seriesClass } from '../chart';
import { AbsenceSection } from '../components/AbsenceSection';
import { HeadcountSection } from '../components/HeadcountSection';
import { InsightsToolbar } from '../components/InsightsToolbar';
import { SalarySection } from '../components/SalarySection';
import { TenureSection } from '../components/TenureSection';
import { TurnoverSection } from '../components/TurnoverSection';
import { useInsightCategories } from '../hooks/useInsights';
import { useInsightsParams } from '../hooks/useInsightsParams';

/** Company figures for a year (admin): headcount, turnover, tenure, absence, salary. */
export default function InsightsPage() {
  const { t } = useTranslation('insights');
  useDocumentTitle(t('pageTitle'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
  // This year and month (UTC, as the figures), read once per visit (no clock in render).
  const [now] = useState(nowUtc);
  const { filter, update } = useInsightsParams(now.year);
  const filterKey = `${String(filter.year)}-${filter.categoryId ?? 'all'}`;
  const categoryData = useInsightCategories().data;
  const categories = useMemo(() => categoryData?.categories ?? [], [categoryData]);

  // A category keeps its colour everywhere (its place among all categories); positions within
  // one category take colours by their own order.
  const colorFor = useCallback(
    (groupId: string, index: number) => {
      const place = categories.findIndex((category) => category.id === groupId);
      return seriesClass(place >= 0 ? place : index);
    },
    [categories],
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Typography
              ref={headingRef}
              tabIndex={-1}
              variant="h4"
              component="h1"
              className="outline-none"
            >
              {t('title')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {t('subtitle')}
            </Typography>
          </div>
          <InsightsToolbar
            filter={filter}
            currentYear={now.year}
            categories={categories}
            onChange={update}
          />
        </div>
        {/* Another year or category starts each chart afresh (selection, hidden groups). */}
        <HeadcountSection key={`headcount-${filterKey}`} filter={filter} colorFor={colorFor} />
        <TurnoverSection key={`turnover-${filterKey}`} filter={filter} now={now} />
        <TenureSection filter={filter} colorFor={colorFor} />
        <AbsenceSection filter={filter} />
        <SalarySection filter={filter} />
      </div>
    </LazyMotion>
  );
}
