import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { type DashboardReviews, EVENTS_PAGE_SIZE } from '../types';
import { EVENT_TONES } from './eventTones';
import { EventCard } from './EventCard';
import { EventList } from './EventList';
import { EventPagination } from './EventPagination';
import { ReviewEventRow } from './EventRows';

export interface ReviewsEventCardProps {
  id: string;
  query: UseQueryResult<DashboardReviews>;
  page: number;
  onPage: (page: number) => void;
  subtitle?: string;
  emptyText: string;
  action?: ReactNode;
}

/** Reviews of a day or a month, five a page. */
export function ReviewsEventCard({
  id,
  query,
  page,
  onPage,
  subtitle,
  emptyText,
  action,
}: ReviewsEventCardProps) {
  const { t, i18n } = useTranslation('dashboard');
  const total = query.data?.totalElements;
  return (
    <EventCard
      id={id}
      icon={EventNoteOutlined}
      tone={EVENT_TONES.reviews}
      title={t('events.reviews.title')}
      {...(subtitle ? { subtitle } : {})}
      count={total === undefined ? undefined : new Intl.NumberFormat(i18n.language).format(total)}
      action={action}
      isLoading={query.isPending}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      isEmpty={total === 0}
      empty={{ title: t('events.reviews.emptyTitle'), text: emptyText }}
      footer={
        <EventPagination
          label={t('events.reviews.pages')}
          page={page}
          total={total ?? 0}
          onPage={onPage}
        />
      }
    >
      <EventList paged={(total ?? 0) > EVENTS_PAGE_SIZE} stale={query.isPlaceholderData}>
        {query.data?.content.map((review) => (
          <ReviewEventRow key={review.id} review={review} />
        ))}
      </EventList>
    </EventCard>
  );
}
