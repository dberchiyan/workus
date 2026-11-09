import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { previousDay, todayUtcIso } from '@/shared/lib/utcDay';
import { isApiError } from '@/shared/api/apiError';
import { cn } from '@/shared/lib/cn';
import { formatDayHeading, dayKey } from '../activityFormat';
import { ACTIVITY_PAGE_SIZE, useEmployeeActivity } from '../hooks/useEmployeeActivity';
import type { ActivityEvent } from '../types';
import { ActivityEventItem } from './ActivityEventItem';
import { ProfileEmptyState } from './ProfileEmptyState';

interface DayGroup {
  key: string;
  date: Date;
  events: ActivityEvent[];
}

/** Events are newest first, so consecutive grouping keeps the order. */
const groupByDay = (events: ActivityEvent[]): DayGroup[] => {
  const groups: DayGroup[] = [];
  for (const event of events) {
    const date = new Date(event.occurredAt);
    const key = dayKey(date);
    const last = groups.at(-1);
    if (last?.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, date, events: [event] });
    }
  }
  return groups;
};

/** "Today" / "Yesterday" / "Monday, 3 November 2026" — days in UTC, as everywhere. */
const useDayHeading = () => {
  const { t, i18n } = useTranslation('employee');
  const today = todayUtcIso();
  return (group: DayGroup): string =>
    group.key === today
      ? t('profile.activity.today')
      : group.key === previousDay(today)
        ? t('profile.activity.yesterday')
        : formatDayHeading(group.date, i18n.language);
};

/** Who changed what and when — the employee's audit trail as a timeline of cards, ten a page. */
export function ProfileActivityTab({ employeeId }: { employeeId: string }) {
  const { t, i18n } = useTranslation(['employee', 'errors']);
  const headingId = useId();
  const dayHeading = useDayHeading();
  const [page, setPage] = useState(0);
  const query = useEmployeeActivity(employeeId, page);

  if (query.isPending) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4 p-4 sm:p-6">
        <span className="sr-only">{t('profile.activity.loading')}</span>
        <Skeleton variant="text" className="w-48" />
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex gap-4">
            <Skeleton variant="circular" className="size-9 shrink-0" />
            <Skeleton variant="rounded" className="h-28 flex-1" />
          </div>
        ))}
      </div>
    );
  }
  if (!query.data) {
    return (
      <div className="p-4 sm:p-6">
        <Alert
          severity="error"
          role="alert"
          action={
            <Button color="inherit" size="small" onClick={() => void query.refetch()}>
              {t('profile.activity.retry')}
            </Button>
          }
        >
          {t(`errors:${isApiError(query.error) ? query.error.code : 'INTERNAL_ERROR'}`)}
        </Alert>
      </div>
    );
  }

  const events = query.data.content;
  const total = query.data.totalElements;
  const pages = Math.ceil(total / ACTIVITY_PAGE_SIZE);
  if (events.length === 0) {
    return (
      <ProfileEmptyState
        icon={<HistoryOutlined fontSize="large" />}
        title={t('profile.activity.empty')}
        hint={t('profile.activity.emptyHint')}
      />
    );
  }
  const groups = groupByDay(events);
  const lastId = events.at(-1)?.id;
  const count = new Intl.NumberFormat(i18n.language);

  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-divider px-4 py-3 sm:px-6">
        <Typography id={headingId} variant="h6" component="h3">
          {t('profile.activity.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary" className="app-tabular">
          {t('profile.activity.summary', { count: total })}
        </Typography>
      </div>
      <div
        aria-busy={query.isPlaceholderData}
        className={cn(
          'flex flex-col gap-2 px-4 pt-4 sm:px-6 sm:pt-5',
          query.isPlaceholderData && 'opacity-60',
        )}
      >
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`${headingId}-${group.key}`}>
            <Typography
              id={`${headingId}-${group.key}`}
              variant="subtitle2"
              component="h4"
              color="textSecondary"
              className="mb-3"
            >
              {dayHeading(group)}
            </Typography>
            <ol className="m-0 list-none p-0">
              {group.events.map((event) => (
                <ActivityEventItem key={event.id} event={event} isLast={event.id === lastId} />
              ))}
            </ol>
          </section>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider px-4 py-3 sm:px-6">
          <Typography variant="caption" color="textSecondary" className="app-tabular">
            {t('profile.activity.range', {
              from: count.format(page * ACTIVITY_PAGE_SIZE + 1),
              to: count.format(Math.min(total, (page + 1) * ACTIVITY_PAGE_SIZE)),
              count: count.format(total),
            })}
          </Typography>
          <Pagination
            shape="rounded"
            color="primary"
            count={pages}
            page={Math.min(page + 1, pages)}
            siblingCount={0}
            aria-label={t('profile.activity.pages')}
            onChange={(_event, value) => {
              setPage(value - 1);
            }}
          />
        </div>
      )}
    </section>
  );
}
