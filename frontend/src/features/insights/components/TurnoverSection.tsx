import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { monthLabels } from '../chart';
import { useTurnover } from '../hooks/useInsights';
import type { InsightsFilter, TurnoverMovement } from '../types';
import { ChartLegend } from './ChartLegend';
import { ChartTable } from './ChartTable';
import { ColumnsChart } from './ColumnsChart';
import { DeltaLine } from './DeltaLine';
import { Figure } from './Figure';
import { InsightSection } from './InsightSection';
import { PersonLine } from './PersonLine';

const HIRED = 'bg-chart-c1';
const LEFT = 'bg-chart-c2';

/** Hires and leavers per month side by side; a month lists who joined and who left. */
export interface TurnoverSectionProps {
  filter: InsightsFilter;
  /** The viewer's current year and month, read once per visit. */
  now: { year: number; month: number };
}

export function TurnoverSection({ filter, now }: TurnoverSectionProps) {
  const { t, i18n } = useTranslation('insights');
  const query = useTurnover(filter);
  const [picked, setPicked] = useState<number | undefined>();
  const [showTable, setShowTable] = useState(false);
  const data = query.data;
  const short = monthLabels(i18n.language);
  const long = monthLabels(i18n.language, 'long');
  const narrow = monthLabels(i18n.language, 'narrow');
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
  const day = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${iso}T00:00:00Z`));
  const percent = (value: number) =>
    new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(value);

  // Months of the current year that have not started stay empty.
  const lastMonth = filter.year === now.year ? now.month : 12;
  const active = data?.months.filter((month) => month.hired.length + month.left.length > 0) ?? [];
  const selected =
    picked !== undefined && picked <= lastMonth ? picked : (active.at(-1)?.month ?? lastMonth);
  const month = data?.months.find((item) => item.month === selected);
  const series = [
    { key: 'hired', label: t('turnover.hired'), className: HIRED, hidden: false },
    { key: 'left', label: t('turnover.left'), className: LEFT, hidden: false },
  ];
  const people = (title: string, list: TurnoverMovement[]) =>
    list.length > 0 && (
      <div className="flex flex-col gap-2">
        <Typography variant="overline" color="textSecondary">
          {title} · {number(list.length)}
        </Typography>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {list.map((person) => (
            <li key={`${person.employeeId}-${person.date}`} className="flex">
              <PersonLine
                person={person}
                end={
                  <Typography variant="caption" color="textSecondary" className="app-tabular">
                    {day(person.date)}
                  </Typography>
                }
              />
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <InsightSection
      id="insight-turnover"
      title={t('turnover.title')}
      subtitle={t('turnover.subtitle')}
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
            value={
              data.rate === null ? '—' : t('turnover.rateValue', { value: percent(data.rate) })
            }
            label={`${t('turnover.rate')} · ${t('turnover.totals', { hired: number(data.hiredTotal), left: number(data.leftTotal) })}`}
            delta={
              data.rate !== null &&
              data.previousRate !== null && (
                <DeltaLine
                  direction={Math.round((data.rate - data.previousRate) * 10)}
                  change={`${data.rate - data.previousRate > 0 ? '+' : '−'}${percent(Math.abs(data.rate - data.previousRate))} pp`}
                  previousYear={filter.year - 1}
                  better="down"
                />
              )
            }
          />
        )
      }
      about={{ title: t('turnover.aboutTitle'), text: t('turnover.about') }}
      aside={
        month && (
          <div className="flex flex-col gap-3 border-t border-divider pt-4">
            <Typography variant="subtitle2" component="h3">
              {t('turnover.selected', { month: long[month.month - 1] })}
            </Typography>
            {month.hired.length + month.left.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                {t('turnover.nobody', { month: long[month.month - 1] })}
              </Typography>
            ) : (
              <>
                {people(t('turnover.hired'), month.hired)}
                {people(t('turnover.left'), month.left)}
              </>
            )}
          </div>
        )
      }
    >
      {data && (
        <div className="flex flex-col gap-5">
          <ChartLegend label={t('turnover.title')} items={series} />
          {showTable ? (
            <ChartTable
              caption={t('turnover.title')}
              columns={[t('common.month'), t('turnover.hired'), t('turnover.left')]}
              rows={data.months
                .filter((item) => item.month <= lastMonth)
                .map((item) => ({
                  key: String(item.month),
                  cells: [
                    long[item.month - 1] ?? '',
                    number(item.hired.length),
                    number(item.left.length),
                  ],
                }))}
            />
          ) : (
            <ColumnsChart
              label={t('turnover.title')}
              mode="paired"
              series={series}
              animationKey={`${String(filter.year)}-${filter.categoryId ?? 'all'}`}
              selectedKey={String(selected)}
              onSelect={(key) => {
                setPicked(Number(key));
              }}
              columns={data.months.map((item) => ({
                key: String(item.month),
                label: short[item.month - 1] ?? '',
                narrowLabel: narrow[item.month - 1] ?? '',
                values: item.month <= lastMonth ? [item.hired.length, item.left.length] : null,
                description:
                  item.month <= lastMonth
                    ? t('turnover.column', {
                        month: long[item.month - 1],
                        hired: item.hired.length,
                        left: item.left.length,
                      })
                    : t('turnover.future', { month: long[item.month - 1] }),
              }))}
            />
          )}
        </div>
      )}
    </InsightSection>
  );
}
