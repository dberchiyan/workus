import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { previousDay, todayUtcIso } from '@/shared/lib/utcDay';
import { groupSecurityEvents, isSecurityCategory, SECURITY_CATEGORIES } from '../securityLog';
import type { SecurityCategory, SecurityLog } from '../types';
import { SecurityEventRow } from './SecurityEventRow';

const ALL = 'ALL';

export interface SecurityLogViewProps {
  log: UseInfiniteQueryResult<InfiniteData<SecurityLog>>;
  category: SecurityCategory | undefined;
  onCategory: (category: SecurityCategory | undefined) => void;
}

/**
 * A security log: a filter by kind, then the events by day (UTC), alike ones from one device
 * folded into one row, and "Show more". Own log in Settings, an employee's for admins.
 */
export function SecurityLogView({ log, category, onCategory }: SecurityLogViewProps) {
  const { t, i18n } = useTranslation('auth');
  const [now] = useState(() => Date.now());
  const today = todayUtcIso();
  const events = useMemo(() => log.data?.pages.flatMap((page) => page.content) ?? [], [log.data]);
  const days = useMemo(() => groupSecurityEvents(events), [events]);

  const dayLabel = (day: string): string => {
    if (day === today) {
      return t('securityLog.today');
    }
    if (day === previousDay(today)) {
      return t('securityLog.yesterday');
    }
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      ...(day.slice(0, 4) === today.slice(0, 4) ? {} : { year: 'numeric' }),
      timeZone: 'UTC',
    }).format(new Date(`${day}T00:00:00Z`));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* On a phone the options stay on one line and scroll sideways. */}
        <div className="overflow-x-auto">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={category ?? ALL}
            aria-label={t('securityLog.filter')}
            onChange={(_event, value: unknown) => {
              // Clicking the selected button again keeps it (one option is always on).
              if (value !== null) {
                onCategory(isSecurityCategory(value) ? value : undefined);
              }
            }}
            className="w-max"
          >
            <ToggleButton value={ALL} className="whitespace-nowrap">
              {t('securityLog.categories.ALL')}
            </ToggleButton>
            {SECURITY_CATEGORIES.map((option) => (
              <ToggleButton key={option} value={option} className="whitespace-nowrap">
                {t(`securityLog.categories.${option}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
        <Typography variant="caption" color="textSecondary">
          {t('securityLog.timesInUtc')}
        </Typography>
      </div>

      {log.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void log.refetch()}>
              {t('securityLog.retry')}
            </Button>
          }
        >
          {t('securityLog.error')}
        </Alert>
      ) : log.isPending ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">{t('securityLog.loading')}</span>
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
        </div>
      ) : days.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <ShieldOutlined aria-hidden fontSize="large" className="text-text-disabled" />
          <Typography variant="subtitle1" component="p">
            {category ? t('securityLog.emptyFiltered') : t('securityLog.empty')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {category ? t('securityLog.emptyFilteredHint') : t('securityLog.emptyHint')}
          </Typography>
        </div>
      ) : (
        <div
          aria-busy={log.isPlaceholderData}
          className={cn('flex flex-col gap-4', log.isPlaceholderData && 'opacity-60')}
        >
          {days.map(({ day, groups }) => (
            <section key={day} aria-label={dayLabel(day)} className="flex flex-col gap-1">
              <Typography variant="overline" component="h3" color="textSecondary">
                {dayLabel(day)}
              </Typography>
              <ul className="-mx-3 my-0 flex list-none flex-col gap-1 p-0">
                {groups.map((group) => (
                  <SecurityEventRow key={group.id} group={group} today={today} now={now} />
                ))}
              </ul>
            </section>
          ))}
          {log.hasNextPage && (
            <Button
              variant="outlined"
              disabled={log.isFetchingNextPage}
              onClick={() => void log.fetchNextPage()}
              className="self-center"
            >
              {log.isFetchingNextPage ? t('securityLog.loadingMore') : t('securityLog.showMore')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
