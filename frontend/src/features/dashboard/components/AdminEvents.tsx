import { styled } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { currentMonthLocal } from '@/shared/lib/month';
import { useEventBirthdays, useEventReviews, useTodayRequests } from '../hooks/useAdminDashboard';
import { type EventsTab, useEventsParams } from '../hooks/useEventsParams';
import type { DateRange, LocalDay } from '../types';
import { MonthEventsPanel } from './MonthEventsPanel';
import { TodayEventsPanel } from './TodayEventsPanel';

/** Compact tab: content-wide, still a 44 px touch target. */
const EventsTabButton = styled(Tab)(({ theme }) => ({
  minWidth: 0,
  minHeight: theme.spacing(5.5),
  paddingInline: theme.spacing(1.5),
}));

/** The viewer's today, fixed for the visit (no clock in render). */
const localDay = (): LocalDay => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const date = `${String(start.getFullYear())}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  return { date, from: start.toISOString(), to: end.toISOString() };
};

/** First and last day of `YYYY-MM`. */
const monthRange = (month: string): DateRange => {
  const [year = 0, index = 1] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
};

/** Today's events and events by month (admin dashboard, under the figures). */
export function AdminEvents() {
  const { t, i18n } = useTranslation('dashboard');
  const [day] = useState(localDay);
  const [currentMonth] = useState(currentMonthLocal);
  const { params, update } = useEventsParams(currentMonth);
  const onToday = params.tab === 'today';
  // The open tab's cards use the pages in the URL; the other tab's first pages give its count.
  const todayRange = { from: day.date, to: day.date };
  const requests = useTodayRequests(day);
  const todayReviews = useEventReviews(todayRange, onToday ? params.reviewsPage : 0);
  const todayBirthdays = useEventBirthdays(todayRange, onToday ? params.birthdaysPage : 0);
  const monthReviews = useEventReviews(
    monthRange(params.reviewsMonth),
    onToday ? 0 : params.reviewsPage,
  );
  const monthBirthdays = useEventBirthdays(
    monthRange(params.birthdaysMonth),
    onToday ? 0 : params.birthdaysPage,
  );

  /** Undefined until every part has loaded. */
  const sum = (...totals: (number | undefined)[]): number | undefined => {
    let all = 0;
    for (const total of totals) {
      if (total === undefined) {
        return undefined;
      }
      all += total;
    }
    return all;
  };
  const todayTotal = sum(
    requests.data?.totalElements,
    todayReviews.data?.totalElements,
    todayBirthdays.data?.totalElements,
  );
  const monthTotal = sum(monthReviews.data?.totalElements, monthBirthdays.data?.totalElements);
  const onReviewsPage = (reviewsPage: number) => {
    update({ reviewsPage });
  };
  const onBirthdaysPage = (birthdaysPage: number) => {
    update({ birthdaysPage });
  };
  const tabs: { value: EventsTab; label: string; count: number | undefined }[] = [
    { value: 'today', label: t('events.tabs.today'), count: todayTotal },
    { value: 'month', label: t('events.tabs.month'), count: monthTotal },
  ];

  return (
    <section aria-labelledby="events-heading" className="flex flex-col gap-4">
      <Typography id="events-heading" variant="h5" component="h2" className="sr-only">
        {t('events.heading')}
      </Typography>
      <Tabs
        value={params.tab}
        onChange={(_event, tab: EventsTab) => {
          update({ tab });
        }}
        aria-label={t('events.heading')}
        slotProps={{ indicator: { className: 'h-0.5' } }}
        className="min-h-11 border-b border-divider"
      >
        {tabs.map((tab) => (
          <EventsTabButton
            key={tab.value}
            value={tab.value}
            id={`events-tab-${tab.value}`}
            aria-controls={`events-panel-${tab.value}`}
            label={
              <span className="flex items-center gap-2">
                <Typography variant="subtitle2" component="span">
                  {tab.label}
                </Typography>
                {tab.count !== undefined && (
                  <Typography
                    variant="caption"
                    component="span"
                    className={cn(
                      'app-tabular min-w-6 rounded-full px-2 text-center',
                      tab.value === params.tab
                        ? 'bg-badge-active-background text-badge-active-text'
                        : 'bg-badge-neutral-background text-badge-neutral-text',
                    )}
                  >
                    {new Intl.NumberFormat(i18n.language).format(tab.count)}
                  </Typography>
                )}
              </span>
            }
          />
        ))}
      </Tabs>
      <div
        role="tabpanel"
        id={`events-panel-${params.tab}`}
        aria-labelledby={`events-tab-${params.tab}`}
      >
        {onToday ? (
          <TodayEventsPanel
            requests={requests}
            reviews={todayReviews}
            birthdays={todayBirthdays}
            reviewsPage={params.reviewsPage}
            birthdaysPage={params.birthdaysPage}
            onReviewsPage={onReviewsPage}
            onBirthdaysPage={onBirthdaysPage}
          />
        ) : (
          <MonthEventsPanel
            reviewsMonth={params.reviewsMonth}
            birthdaysMonth={params.birthdaysMonth}
            reviews={monthReviews}
            birthdays={monthBirthdays}
            reviewsPage={params.reviewsPage}
            birthdaysPage={params.birthdaysPage}
            onReviewsPage={onReviewsPage}
            onBirthdaysPage={onBirthdaysPage}
            onReviewsMonth={(reviewsMonth) => {
              update({ reviewsMonth });
            }}
            onBirthdaysMonth={(birthdaysMonth) => {
              update({ birthdaysMonth });
            }}
          />
        )}
      </div>
    </section>
  );
}
