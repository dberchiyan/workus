import CakeOutlined from '@mui/icons-material/CakeOutlined';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { type DashboardBirthdays, EVENTS_PAGE_SIZE } from '../types';
import { EVENT_TONES } from './eventTones';
import { EventCard } from './EventCard';
import { EventList } from './EventList';
import { EventPagination } from './EventPagination';
import { BirthdayEventRow } from './EventRows';

export interface BirthdaysEventCardProps {
  id: string;
  query: UseQueryResult<DashboardBirthdays>;
  page: number;
  onPage: (page: number) => void;
  subtitle?: string;
  emptyText: string;
  action?: ReactNode;
}

/** Birthdays of a day or a month, five a page. */
export function BirthdaysEventCard({
  id,
  query,
  page,
  onPage,
  subtitle,
  emptyText,
  action,
}: BirthdaysEventCardProps) {
  const { t, i18n } = useTranslation('dashboard');
  const total = query.data?.totalElements;
  return (
    <EventCard
      id={id}
      icon={CakeOutlined}
      tone={EVENT_TONES.birthdays}
      title={t('events.birthdays.title')}
      {...(subtitle ? { subtitle } : {})}
      count={total === undefined ? undefined : new Intl.NumberFormat(i18n.language).format(total)}
      action={action}
      isLoading={query.isPending}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      isEmpty={total === 0}
      empty={{ title: t('events.birthdays.emptyTitle'), text: emptyText }}
      footer={
        <EventPagination
          label={t('events.birthdays.pages')}
          page={page}
          total={total ?? 0}
          onPage={onPage}
        />
      }
    >
      <EventList paged={(total ?? 0) > EVENTS_PAGE_SIZE} stale={query.isPlaceholderData}>
        {query.data?.content.map((birthday) => (
          <BirthdayEventRow key={birthday.employee.id} birthday={birthday} />
        ))}
      </EventList>
    </EventCard>
  );
}
