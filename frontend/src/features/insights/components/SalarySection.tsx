import Typography from '@mui/material/Typography';
import { m, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, type Money, toUnits } from '@/shared/lib/money';
import { useSalary } from '../hooks/useInsights';
import type { InsightsFilter } from '../types';
import { ChartTable } from './ChartTable';
import { DeltaLine } from './DeltaLine';
import { Figure } from './Figure';
import { InsightSection } from './InsightSection';

/** Share of `value` in `max` for drawing (exact integers; a ratio, not an amount). */
const share = (value: Money, max: Money): number => {
  const top = toUnits(max.amount);
  return top <= 0n ? 0 : Number((toUnits(value.amount) * 10_000n) / top) / 10_000;
};

/** (current − previous) / previous in tenths of a percent, exact; null without a base. */
const changeTenths = (current: Money, previous: Money): number | null => {
  const base = toUnits(previous.amount);
  return base === 0n ? null : Number(((toUnits(current.amount) - base) * 1000n) / base);
};

/** Average monthly salary per group as horizontal bars, highest first, labelled directly. */
export function SalarySection({ filter }: { filter: InsightsFilter }) {
  const { t, i18n } = useTranslation('insights');
  const reduceMotion = useReducedMotion();
  const query = useSalary(filter);
  const [showTable, setShowTable] = useState(false);
  const data = query.data;
  const money = (value: Money) => formatMoney(value, i18n.language);
  const top = data?.groups[0]?.average;
  const tenths =
    data?.average && data.previousAverage ? changeTenths(data.average, data.previousAverage) : null;
  const animationKey = `${String(filter.year)}-${filter.categoryId ?? 'all'}`;

  return (
    <InsightSection
      id="insight-salary"
      title={t('salary.title')}
      subtitle={t('salary.subtitle')}
      isLoading={query.isPending}
      isError={query.isError}
      isStale={query.isPlaceholderData}
      onRetry={() => void query.refetch()}
      table={{
        shown: showTable,
        onToggle: () => {
          setShowTable((shown) => !shown);
        },
      }}
      figure={
        data && (
          <Figure
            value={data.average ? money(data.average) : '—'}
            label={t('salary.label')}
            delta={
              tenths !== null && (
                <DeltaLine
                  direction={tenths}
                  change={`${tenths > 0 ? '+' : '−'}${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(Math.abs(tenths) / 10)} %`}
                  previousYear={filter.year - 1}
                  better="up"
                />
              )
            }
          />
        )
      }
      about={{ title: t('salary.aboutTitle'), text: t('salary.about') }}
    >
      {data && data.groups.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          {t('common.empty')}
        </Typography>
      ) : showTable ? (
        <ChartTable
          caption={t('salary.title')}
          columns={[t('salary.group'), t('salary.average'), t('common.total')]}
          rows={(data?.groups ?? []).map((group) => ({
            key: group.id,
            cells: [
              group.name,
              money(group.average),
              t('salary.employees', { count: group.employees }),
            ],
          }))}
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {data?.groups.map((group, index) => (
            <li
              key={group.id}
              className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-4"
            >
              <span className="flex min-w-0 flex-col">
                <Typography variant="body2" className="truncate">
                  {group.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {t('salary.employees', { count: group.employees })}
                </Typography>
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <span className="h-7 min-w-0 flex-1">
                  <m.span
                    key={`${animationKey}-${group.id}`}
                    className="block h-full origin-left rounded-e-md bg-chart-c1"
                    style={{
                      width: `${String(top ? Math.max(2, share(group.average, top) * 100) : 0)}%`,
                    }}
                    {...(reduceMotion
                      ? {}
                      : {
                          initial: { scaleX: 0 },
                          animate: { scaleX: 1 },
                          transition: {
                            duration: 0.5,
                            delay: index * 0.05,
                            ease: 'easeOut' as const,
                          },
                        })}
                  />
                </span>
                <Typography
                  variant="subtitle2"
                  component="span"
                  className="app-tabular w-24 shrink-0 text-right"
                >
                  {money(group.average)}
                </Typography>
              </span>
            </li>
          ))}
        </ul>
      )}
    </InsightSection>
  );
}
