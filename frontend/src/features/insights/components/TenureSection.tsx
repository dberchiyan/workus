import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { yearsAndMonths } from '../chart';
import { useTenure } from '../hooks/useInsights';
import type { InsightsFilter } from '../types';
import { DeltaLine } from './DeltaLine';
import { Figure } from './Figure';
import { InsightSection } from './InsightSection';

export interface TenureSectionProps {
  filter: InsightsFilter;
  /** A category's colour class (the same on every chart). */
  colorFor: (groupId: string, index: number) => string;
}

/** One card per category: its average tenure, then each position's, as bars. */
export function TenureSection({ filter, colorFor }: TenureSectionProps) {
  const { t, i18n } = useTranslation('insights');
  const reduceMotion = useReducedMotion();
  const query = useTenure(filter);
  const data = query.data;
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
  const span = (months: number) => {
    const parts = yearsAndMonths(months);
    return parts.years === 0
      ? t('common.months', { count: parts.months })
      : t('common.yearsMonths', { years: parts.years, months: parts.months });
  };
  const animationKey = `${String(filter.year)}-${filter.categoryId ?? 'all'}`;

  return (
    <InsightSection
      id="insight-tenure"
      title={t('tenure.title')}
      subtitle={t('tenure.subtitle')}
      isLoading={query.isPending}
      isError={query.isError}
      isStale={query.isPlaceholderData}
      onRetry={() => void query.refetch()}
      figure={
        data && (
          <Figure
            value={data.averageMonths === null ? '—' : span(data.averageMonths)}
            label={t('tenure.label')}
            delta={
              data.averageMonths !== null &&
              data.previousAverageMonths !== null && (
                <DeltaLine
                  direction={data.averageMonths - data.previousAverageMonths}
                  change={`${data.averageMonths - data.previousAverageMonths > 0 ? '+' : '−'}${t('common.months', { count: Math.abs(data.averageMonths - data.previousAverageMonths) })}`}
                  previousYear={filter.year - 1}
                  better="up"
                />
              )
            }
          />
        )
      }
      about={{ title: t('tenure.aboutTitle'), text: t('tenure.about') }}
    >
      {data && data.groups.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          {t('common.empty')}
        </Typography>
      ) : (
        <ul className="2xl:grid-cols-3 m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
          {data?.groups.map((group, index) => {
            const longest = Math.max(1, ...group.items.map((item) => item.averageMonths));
            return (
              <li key={group.id}>
                <Card variant="outlined" className="flex h-full overflow-hidden">
                  <span aria-hidden className={cn('w-1 shrink-0', colorFor(group.id, index))} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <Typography variant="subtitle1" component="h3" className="truncate">
                        {group.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" className="shrink-0">
                        {t('tenure.employees', { count: group.employees })}
                      </Typography>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <Typography
                        variant="h4"
                        component="p"
                        color="primary"
                        className="app-tabular"
                      >
                        {number(group.averageMonths)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {t('common.monthsUnit', { count: group.averageMonths })}
                        {group.averageMonths >= 12 && ` · ${span(group.averageMonths)}`}
                      </Typography>
                    </div>
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex flex-col gap-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <Typography variant="body2" className="truncate">
                              {item.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              className="app-tabular shrink-0"
                            >
                              {t('common.months', { count: item.averageMonths })}
                            </Typography>
                          </span>
                          <span
                            aria-hidden
                            className="h-1.5 overflow-hidden rounded-full bg-badge-neutral-background"
                          >
                            <m.span
                              key={`${animationKey}-${item.id}`}
                              className={cn(
                                'block h-full origin-left rounded-full',
                                colorFor(group.id, index),
                              )}
                              style={{ width: `${String((item.averageMonths / longest) * 100)}%` }}
                              {...(reduceMotion
                                ? {}
                                : {
                                    initial: { scaleX: 0 },
                                    animate: { scaleX: 1 },
                                    transition: { duration: 0.5, ease: 'easeOut' as const },
                                  })}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </InsightSection>
  );
}
