import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { ReviewStatusChip } from '@/features/employee/review';
import { TimeOffStatusChip, TimeOffTypeChip } from '@/features/time-off';
import { requestPath } from '@/shared/lib/paths';
import type { DashboardBirthday, DashboardRequest, DashboardReview } from '../types';
import { EventPerson } from './EventPerson';

const ROW =
  'flex flex-col gap-2 border-b border-divider px-4 py-3 last:border-b-0 @lg:flex-row @lg:items-center @lg:gap-4 sm:px-5';

const dayMonth = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/** A request made today: who, what, its state, and a way into it. */
export function RequestEventRow({ request }: { request: DashboardRequest }) {
  const { t, i18n } = useTranslation('dashboard');
  const period =
    request.startDate === request.endDate
      ? dayMonth(request.startDate, i18n.language)
      : `${dayMonth(request.startDate, i18n.language)} – ${dayMonth(request.endDate, i18n.language)}`;
  const madeAt = new Intl.DateTimeFormat(i18n.language, { timeStyle: 'short' }).format(
    new Date(request.createdAt),
  );
  const name = `${request.employee.firstName} ${request.employee.lastName}`;
  return (
    <li className={ROW}>
      <span className="min-w-0 @lg:w-56 @lg:shrink-0">
        <EventPerson employee={request.employee} />
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <TimeOffTypeChip type={request.type} />
        <Typography variant="body2" className="app-tabular">
          {period}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('events.requests.days', { count: request.days })}
        </Typography>
      </span>
      <span className="flex items-center gap-3">
        <TimeOffStatusChip status={request.status} />
        <Typography variant="caption" color="textSecondary" className="app-tabular">
          {t('events.requests.madeAt', { time: madeAt })}
        </Typography>
        <IconButton
          component={RouterLink}
          to={requestPath(request.id)}
          size="small"
          aria-label={t('events.requests.open', { name })}
          className="ml-auto"
        >
          <ChevronRightOutlined fontSize="small" />
        </IconButton>
      </span>
    </li>
  );
}

/** A review: whose, which and when. */
export function ReviewEventRow({ review }: { review: DashboardReview }) {
  const { i18n } = useTranslation('dashboard');
  return (
    <li className={ROW}>
      <span className="min-w-0 @lg:w-56 @lg:shrink-0">
        <EventPerson employee={review.employee} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <Typography variant="body2" className="truncate">
          {review.title}
        </Typography>
        <Typography variant="caption" color="textSecondary" className="app-tabular">
          {dayMonth(review.reviewDate, i18n.language)}
        </Typography>
      </span>
      <span className="shrink-0">
        <ReviewStatusChip status={review.status} />
      </span>
    </li>
  );
}

/** A birthday: day and month only. */
export function BirthdayEventRow({ birthday }: { birthday: DashboardBirthday }) {
  const { i18n } = useTranslation('dashboard');
  // 2000 is a leap year, so 29 February formats too.
  const date = `2000-${String(birthday.month).padStart(2, '0')}-${String(birthday.day).padStart(2, '0')}`;
  return (
    // Short enough to stay on one line at any width.
    <li className="flex items-center gap-4 border-b border-divider px-4 py-3 last:border-b-0 sm:px-5">
      <span className="min-w-0 flex-1">
        <EventPerson employee={birthday.employee} />
      </span>
      <Typography variant="body2" color="textSecondary" className="app-tabular">
        {dayMonth(date, i18n.language)}
      </Typography>
    </li>
  );
}
