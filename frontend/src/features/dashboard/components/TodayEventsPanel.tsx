import InboxOutlined from '@mui/icons-material/InboxOutlined';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { PATHS } from '@/shared/lib/paths';
import type { DashboardBirthdays, DashboardRequests, DashboardReviews } from '../types';
import { BirthdaysEventCard } from './BirthdaysEventCard';
import { EVENT_TONES } from './eventTones';
import { EventCard } from './EventCard';
import { EventList } from './EventList';
import { RequestEventRow } from './EventRows';
import { ReviewsEventCard } from './ReviewsEventCard';

export interface TodayEventsPanelProps {
  requests: UseQueryResult<DashboardRequests>;
  reviews: UseQueryResult<DashboardReviews>;
  birthdays: UseQueryResult<DashboardBirthdays>;
  reviewsPage: number;
  birthdaysPage: number;
  onReviewsPage: (page: number) => void;
  onBirthdaysPage: (page: number) => void;
}

/** Requests made today (full width), then reviews and birthdays side by side. */
export function TodayEventsPanel(props: TodayEventsPanelProps) {
  const { t, i18n } = useTranslation('dashboard');
  const { requests, reviews, birthdays } = props;
  const totals = [requests, reviews, birthdays].map((query) => query.data?.totalElements);
  const nothing = totals.every((total) => total === 0);
  const requestTotal = requests.data?.totalElements;

  return (
    <div className="flex flex-col gap-4">
      {nothing && (
        <Typography variant="body2" color="textSecondary">
          {t('events.today.nothing')}
        </Typography>
      )}
      <EventCard
        id="events-today-requests"
        icon={InboxOutlined}
        tone={EVENT_TONES.requests}
        title={t('events.requests.title')}
        subtitle={t('events.requests.subtitle')}
        count={
          requestTotal === undefined
            ? undefined
            : new Intl.NumberFormat(i18n.language).format(requestTotal)
        }
        action={
          <Button component={RouterLink} to={PATHS.requests} size="small">
            {t('events.requests.all')}
          </Button>
        }
        isLoading={requests.isPending}
        isError={requests.isError}
        onRetry={() => void requests.refetch()}
        isEmpty={requestTotal === 0}
        empty={{ title: t('events.requests.emptyTitle'), text: t('events.requests.emptyText') }}
      >
        <EventList paged={false} stale={false}>
          {requests.data?.content.map((request) => (
            <RequestEventRow key={request.id} request={request} />
          ))}
        </EventList>
      </EventCard>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReviewsEventCard
          id="events-today-reviews"
          query={reviews}
          page={props.reviewsPage}
          onPage={props.onReviewsPage}
          subtitle={t('events.reviews.todaySubtitle')}
          emptyText={t('events.reviews.emptyToday')}
        />
        <BirthdaysEventCard
          id="events-today-birthdays"
          query={birthdays}
          page={props.birthdaysPage}
          onPage={props.onBirthdaysPage}
          subtitle={t('events.birthdays.todaySubtitle')}
          emptyText={t('events.birthdays.emptyToday')}
        />
      </div>
    </div>
  );
}
