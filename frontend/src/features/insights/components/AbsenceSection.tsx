import Typography from '@mui/material/Typography';
import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TIME_OFF_TYPE_VISUALS } from '@/features/time-off';
import { cn } from '@/shared/lib/cn';
import { useAbsence } from '../hooks/useInsights';
import type { Absence, InsightsFilter } from '../types';
import { DeltaLine } from './DeltaLine';
import { Figure } from './Figure';
import { InsightSection } from './InsightSection';
import { PersonLine } from './PersonLine';

type AbsenceType = keyof Absence['top'][number]['byType'];
/** The time-off types in their usual order, coloured as on the Calendar and the Requests page. */
const TYPES: { type: AbsenceType; className: string }[] = (
  ['VACATION', 'SICK_DAY', 'DAY_OFF'] as const
).map((type) => ({ type, className: TIME_OFF_TYPE_VISUALS[type].tone }));

/** The ten people with the most approved days off, each split by type. */
export function AbsenceSection({ filter }: { filter: InsightsFilter }) {
  const { t, i18n } = useTranslation(['insights', 'timeOff']);
  const reduceMotion = useReducedMotion();
  const query = useAbsence(filter);
  const data = query.data;
  const decimal = (value: number) =>
    new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(value);
  const most = Math.max(1, ...(data?.top.map((row) => row.days) ?? []));
  const legend = TYPES.map(({ type }) => ({ key: type, label: t(`timeOff:types.${type}`) }));
  const animationKey = `${String(filter.year)}-${filter.categoryId ?? 'all'}`;

  return (
    <InsightSection
      id="insight-absence"
      title={t('absence.title')}
      subtitle={t('absence.subtitle')}
      isLoading={query.isPending}
      isError={query.isError}
      isStale={query.isPlaceholderData}
      onRetry={() => void query.refetch()}
      figure={
        data && (
          <Figure
            value={data.averageDays === null ? '—' : decimal(data.averageDays)}
            label={t('absence.label')}
            delta={
              data.averageDays !== null &&
              data.previousAverageDays !== null && (
                <DeltaLine
                  direction={Math.round((data.averageDays - data.previousAverageDays) * 10)}
                  change={`${data.averageDays - data.previousAverageDays > 0 ? '+' : '−'}${decimal(Math.abs(data.averageDays - data.previousAverageDays))}`}
                  previousYear={filter.year - 1}
                  better="down"
                />
              )
            }
          />
        )
      }
      about={{ title: t('absence.aboutTitle'), text: t('absence.about') }}
      aside={
        <ul aria-label={t('absence.legend')} className="m-0 flex list-none flex-col gap-2 p-0">
          {legend.map((item) => {
            const { icon: Icon, tone } = TIME_OFF_TYPE_VISUALS[item.key];
            return (
              <li key={item.key} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    'flex size-7 items-center justify-center rounded-md text-avatar-text',
                    tone,
                  )}
                >
                  <Icon fontSize="small" />
                </span>
                <Typography variant="body2">{item.label}</Typography>
              </li>
            );
          })}
        </ul>
      }
    >
      {data && data.top.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          {t('absence.empty')}
        </Typography>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {data?.top.map((row, index) => {
            const parts = TYPES.filter(({ type }) => row.byType[type] > 0)
              .map(({ type }) => `${t(`timeOff:types.${type}`)} ${String(row.byType[type])}`)
              .join(', ');
            return (
              <li
                key={row.person.employeeId}
                className="flex flex-col gap-2 border-b border-divider py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="flex min-w-0 items-center gap-3 sm:w-72 sm:shrink-0">
                  <Typography
                    variant="caption"
                    component="span"
                    className={cn(
                      'app-tabular flex size-7 shrink-0 items-center justify-center rounded-full',
                      index < 3
                        ? 'bg-badge-active-background text-badge-active-text'
                        : 'bg-badge-neutral-background text-badge-neutral-text',
                    )}
                  >
                    {index + 1}
                  </Typography>
                  <PersonLine person={row.person} />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-badge-neutral-background">
                    <m.span
                      key={`${animationKey}-${row.person.employeeId}`}
                      className="flex h-full origin-left"
                      style={{ width: `${String((row.days / most) * 100)}%` }}
                      {...(reduceMotion
                        ? {}
                        : {
                            initial: { scaleX: 0 },
                            animate: { scaleX: 1 },
                            transition: {
                              duration: 0.5,
                              delay: index * 0.04,
                              ease: 'easeOut' as const,
                            },
                          })}
                    >
                      {TYPES.map(({ type, className }) =>
                        row.byType[type] === 0 ? null : (
                          <span
                            key={type}
                            className={cn(
                              'block h-full border-l-2 border-background-paper first:border-l-0',
                              className,
                            )}
                            style={{ flexGrow: row.byType[type], flexBasis: 0 }}
                          />
                        ),
                      )}
                    </m.span>
                  </span>
                  <span className="sr-only">{parts}</span>
                  <Typography
                    variant="subtitle2"
                    component="span"
                    className="app-tabular shrink-0 rounded-full bg-badge-active-background px-2.5 py-0.5 text-badge-active-text"
                  >
                    {t('absence.daysValue', { count: row.days })}
                  </Typography>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </InsightSection>
  );
}
