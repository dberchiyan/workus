import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/apiError';
import { formatDayHeading, localDayKey } from '../activityFormat';
import { useEmployeeActivity } from '../hooks/useEmployeeActivity';
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
    const key = localDayKey(date);
    const last = groups.at(-1);
    if (last?.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, date, events: [event] });
    }
  }
  return groups;
};

/** "Today" / "Yesterday" / "Monday, 3 November 2026" in the viewer's time zone. */
const useDayHeading = () => {
  const { t, i18n } = useTranslation('employee');
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  return (group: DayGroup): string =>
    group.key === localDayKey(today)
      ? t('profile.activity.today')
      : group.key === localDayKey(yesterday)
        ? t('profile.activity.yesterday')
        : formatDayHeading(group.date, i18n.language);
};

/** Who changed what and when — the employee's audit trail as a timeline of cards. */
export function ProfileActivityTab({ employeeId }: { employeeId: string }) {
  const { t, i18n } = useTranslation(['employee', 'errors']);
  const headingId = useId();
  const dayHeading = useDayHeading();
  const query = useEmployeeActivity(employeeId);

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
  // A failed "Show older" keeps the loaded list (TanStack marks the whole query as errored).
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

  const events = query.data.pages.flatMap((page) => page.content);
  const total = query.data.pages[0]?.totalElements ?? 0;
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
      <div className="flex flex-col gap-2 px-4 pt-4 sm:px-6 sm:pt-5">
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
      <div className="flex flex-col items-center gap-2 border-t border-divider px-4 py-4">
        {query.isFetchNextPageError && (
          <Alert severity="error" role="alert" className="w-full">
            {t(`errors:${isApiError(query.error) ? query.error.code : 'INTERNAL_ERROR'}`)}
          </Alert>
        )}
        <Typography
          variant="caption"
          color="textSecondary"
          aria-live="polite"
          className="app-tabular"
        >
          {query.hasNextPage
            ? t('profile.activity.shown', {
                shown: count.format(events.length),
                total: count.format(total),
              })
            : t('profile.activity.end')}
        </Typography>
        {query.hasNextPage && (
          <Button
            variant="outlined"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            aria-busy={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage
              ? t('profile.activity.loadingMore')
              : t('profile.activity.loadMore')}
          </Button>
        )}
      </div>
    </section>
  );
}
