import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import WorkHistoryOutlined from '@mui/icons-material/WorkHistoryOutlined';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCalendarDate, formatCount, formatTenure } from '../format';
import { useEmployeeSummary } from '../hooks/useEmployeeQueries';
import { StatCard } from './StatCard';

const TERMINATION_WINDOW_DAYS = 90;

const daysAgoIso = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

function Hint({
  icon,
  children,
  isPositive = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  isPositive?: boolean;
}) {
  return (
    <Typography
      variant="body2"
      color={isPositive ? undefined : 'textSecondary'}
      className={isPositive ? 'flex items-center gap-1 text-success' : 'flex items-center gap-1'}
    >
      {icon}
      {children}
    </Typography>
  );
}

/** One row of four on desktop; two columns on tablets, one on phones. */
export function EmployeeStatsCards() {
  const { t, i18n } = useTranslation('employee');
  const { data, isPending, isError } = useEmployeeSummary();
  const locale = i18n.language;
  const show = (format: (summary: NonNullable<typeof data>) => string): string | undefined =>
    isPending ? undefined : isError ? '—' : format(data);

  return (
    <section aria-busy={isPending} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('stats.total')}
        value={show((s) => formatCount(s.totalActive, locale))}
        hint={
          data && (
            <Hint isPositive icon={<TrendingUpOutlined aria-hidden fontSize="small" />}>
              {t('stats.growth', { count: data.newLast30Days })}
            </Hint>
          )
        }
      />
      <StatCard
        title={t('stats.terminated')}
        value={show((s) => formatCount(s.terminatedLast90Days, locale))}
        hint={
          <Hint icon={<PersonRemoveOutlined aria-hidden fontSize="small" />}>
            {t('stats.terminatedHint', {
              date: formatCalendarDate(daysAgoIso(TERMINATION_WINDOW_DAYS), locale),
            })}
          </Hint>
        }
      />
      <StatCard
        title={t('stats.averageTenure')}
        value={show((s) => formatTenure(s.averageTenureDays, locale))}
        hint={
          <Hint icon={<WorkHistoryOutlined aria-hidden fontSize="small" />}>
            {t('stats.averageTenureHint')}
          </Hint>
        }
      />
      <StatCard
        title={t('stats.withoutResponsible')}
        value={show((s) => formatCount(s.withoutResponsible, locale))}
        hint={
          <Hint icon={<PersonOffOutlined aria-hidden fontSize="small" />}>
            {t('stats.withoutResponsibleHint')}
          </Hint>
        }
      />
    </section>
  );
}
