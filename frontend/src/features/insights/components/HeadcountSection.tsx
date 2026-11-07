import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { monthLabels, signed } from '../chart';
import { useHeadcount } from '../hooks/useInsights';
import type { InsightsFilter } from '../types';
import { ChartLegend } from './ChartLegend';
import { ChartTable } from './ChartTable';
import { ColumnsChart } from './ColumnsChart';
import { DeltaLine } from './DeltaLine';
import { Figure } from './Figure';
import { InsightSection } from './InsightSection';

export interface HeadcountSectionProps {
  filter: InsightsFilter;
  /** A group's colour class — stable per group across the page. */
  colorFor: (groupId: string, index: number) => string;
}

/** People employed at the end of each month, stacked by group; a month opens its breakdown. */
export function HeadcountSection({ filter, colorFor }: HeadcountSectionProps) {
  const { t, i18n } = useTranslation('insights');
  const query = useHeadcount(filter);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [picked, setPicked] = useState<number | undefined>();
  const [showTable, setShowTable] = useState(false);
  const data = query.data;
  const short = monthLabels(i18n.language);
  const long = monthLabels(i18n.language, 'long');
  const narrow = monthLabels(i18n.language, 'narrow');
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);

  const started = data?.months.filter((month) => month.counts !== null) ?? [];
  const lastStarted = started.at(-1)?.month;
  // The picked month while it exists in this year's data; otherwise the latest one.
  const selected =
    picked !== undefined && started.some((month) => month.month === picked) ? picked : lastStarted;
  const selectedCounts = data?.months.find((month) => month.month === selected)?.counts ?? null;
  const total = (counts: number[] | null) => (counts ?? []).reduce((sum, value) => sum + value, 0);
  const series = (data?.groups ?? []).map((group, index) => ({
    key: group.id,
    label: group.name,
    className: colorFor(group.id, index),
    hidden: hidden.has(group.id),
  }));

  return (
    <InsightSection
      id="insight-headcount"
      title={t('headcount.title')}
      subtitle={t('headcount.subtitle')}
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
            value={number(selected === undefined ? data.current : total(selectedCounts))}
            label={t('headcount.label', { month: selected ? long[selected - 1] : '' })}
            delta={
              selected === lastStarted && (
                <DeltaLine
                  direction={data.current - data.previous}
                  change={signed(data.current - data.previous, i18n.language)}
                  previousYear={filter.year - 1}
                  better="up"
                />
              )
            }
          />
        )
      }
      about={{ title: t('headcount.aboutTitle'), text: t('headcount.about') }}
      aside={
        selectedCounts && (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {series.map((item, index) => (
              <li key={item.key} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={cn('size-2.5 shrink-0 rounded-full', item.className)}
                />
                <Typography variant="body2" className="min-w-0 flex-1 truncate">
                  {item.label}
                </Typography>
                <Typography variant="body2" className="app-tabular">
                  {number(selectedCounts[index] ?? 0)}
                </Typography>
              </li>
            ))}
          </ul>
        )
      }
    >
      {data && (
        <div className="flex flex-col gap-5">
          <ChartLegend
            label={t('headcount.legend')}
            items={series}
            onToggle={(key) => {
              setHidden((current) => {
                const next = new Set(current);
                if (next.has(key)) {
                  next.delete(key);
                } else if (next.size < series.length - 1) {
                  // One group always stays on.
                  next.add(key);
                }
                return next;
              });
            }}
          />
          {showTable ? (
            <ChartTable
              caption={t('headcount.title')}
              columns={[t('common.month'), ...series.map((item) => item.label), t('common.total')]}
              rows={started.map((month) => ({
                key: String(month.month),
                cells: [
                  long[month.month - 1] ?? '',
                  ...(month.counts ?? []).map(number),
                  number(total(month.counts)),
                ],
              }))}
            />
          ) : (
            <ColumnsChart
              label={t('headcount.title')}
              mode="stacked"
              series={series}
              animationKey={`${String(filter.year)}-${filter.categoryId ?? 'all'}`}
              selectedKey={selected === undefined ? undefined : String(selected)}
              onSelect={(key) => {
                setPicked(Number(key));
              }}
              columns={data.months.map((month) => ({
                key: String(month.month),
                label: short[month.month - 1] ?? '',
                narrowLabel: narrow[month.month - 1] ?? '',
                values: month.counts,
                description: month.counts
                  ? t('headcount.column', {
                      month: long[month.month - 1],
                      count: total(month.counts),
                    })
                  : t('headcount.future', { month: long[month.month - 1] }),
              }))}
            />
          )}
        </div>
      )}
    </InsightSection>
  );
}
