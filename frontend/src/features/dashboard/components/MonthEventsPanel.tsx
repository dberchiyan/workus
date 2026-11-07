import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MonthSwitcher } from '@/shared/components/MonthSwitcher';
import type { DashboardBirthdays, DashboardReviews } from '../types';
import { BirthdaysEventCard } from './BirthdaysEventCard';
import { ReviewsEventCard } from './ReviewsEventCard';

export interface MonthEventsPanelProps {
  reviewsMonth: string;
  birthdaysMonth: string;
  reviews: UseQueryResult<DashboardReviews>;
  birthdays: UseQueryResult<DashboardBirthdays>;
  reviewsPage: number;
  birthdaysPage: number;
  onReviewsMonth: (month: string) => void;
  onBirthdaysMonth: (month: string) => void;
  onReviewsPage: (page: number) => void;
  onBirthdaysPage: (page: number) => void;
}

/** Reviews and birthdays of a month, each card with its own month and pages. */
export function MonthEventsPanel(props: MonthEventsPanelProps) {
  const { t, i18n } = useTranslation('dashboard');
  const switcher = (month: string, onChange: (month: string) => void) => (
    <MonthSwitcher
      month={month}
      onChange={onChange}
      locale={i18n.language}
      previousLabel={t('events.month.previous')}
      nextLabel={t('events.month.next')}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReviewsEventCard
        id="events-month-reviews"
        query={props.reviews}
        page={props.reviewsPage}
        onPage={props.onReviewsPage}
        emptyText={t('events.reviews.emptyMonth')}
        action={switcher(props.reviewsMonth, props.onReviewsMonth)}
      />
      <BirthdaysEventCard
        id="events-month-birthdays"
        query={props.birthdays}
        page={props.birthdaysPage}
        onPage={props.onBirthdaysPage}
        emptyText={t('events.birthdays.emptyMonth')}
        action={switcher(props.birthdaysMonth, props.onBirthdaysMonth)}
      />
    </div>
  );
}
