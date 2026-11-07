import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { StatCard } from '@/shared/components/StatCard';
import { employeeProfilePath } from '@/shared/lib/paths';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

const DAY_MS = 86_400_000;
/** A request waiting longer than this is called out. */
const LONG_WAIT_DAYS = 2;

function Hint({ icon, tone, children }: { icon?: ReactNode; tone?: 'error'; children: ReactNode }) {
  return (
    <Typography
      variant="body2"
      component="div"
      color={tone === 'error' ? 'error' : 'textSecondary'}
      // No wrap: in a narrow (two-column phone) card the text wraps beside the icon, not under it.
      className="flex min-h-6 items-start gap-1"
    >
      {icon}
      {children}
    </Typography>
  );
}

/** Admin dashboard: four cards that each lead to something to do. */
export function AdminOverview() {
  const { t, i18n } = useTranslation('dashboard');
  const locale = i18n.language;
  const dashboard = useAdminDashboard();
  const data = dashboard.data;
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  const day = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
      new Date(`${iso}T00:00:00Z`),
    );

  if (dashboard.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void dashboard.refetch()}>
            {t('admin.retry')}
          </Button>
        }
      >
        {t('admin.error')}
      </Alert>
    );
  }

  // Whole days between the oldest request and the server's today (pure: no clock in render).
  const waitedDays = data?.pendingRequests.oldestCreatedAt
    ? Math.max(
        0,
        Math.floor(
          (Date.parse(`${data.today}T00:00:00Z`) -
            Date.parse(`${data.pendingRequests.oldestCreatedAt.slice(0, 10)}T00:00:00Z`)) /
            DAY_MS,
        ),
      )
    : null;
  const next = data?.movements.next;

  return (
    <ul
      className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4"
      aria-busy={dashboard.isPending}
    >
      <li>
        <StatCard
          title={t('admin.pending.title')}
          value={data && number(data.pendingRequests.count)}
          hint={
            data &&
            (waitedDays === null ? (
              <Hint icon={<CheckCircleOutlineOutlined aria-hidden fontSize="small" />}>
                {t('admin.pending.none')}
              </Hint>
            ) : (
              <Hint
                icon={<ScheduleOutlined aria-hidden fontSize="small" />}
                {...(waitedDays > LONG_WAIT_DAYS ? { tone: 'error' as const } : {})}
              >
                {waitedDays === 0
                  ? t('admin.pending.oldestToday')
                  : t('admin.pending.oldest', { count: waitedDays })}
              </Hint>
            ))
          }
        />
      </li>
      <li>
        <StatCard
          title={t('admin.out.title')}
          value={data && number(data.outToday.count)}
          hint={
            data && (
              <Hint
                {...(data.outToday.people.length === 0
                  ? { icon: <EventBusyOutlined aria-hidden fontSize="small" /> }
                  : {})}
              >
                {data.outToday.people.length > 0 && (
                  <span className="mr-1 flex -space-x-1.5" aria-hidden>
                    {data.outToday.people.map((person) => (
                      <InitialsAvatar
                        key={person.id}
                        id={person.id}
                        firstName={person.firstName}
                        lastName={person.lastName}
                        size="sm"
                        className="ring-2 ring-background-paper"
                      />
                    ))}
                  </span>
                )}
                <span className="sr-only">
                  {data.outToday.people
                    .map((person) => `${person.firstName} ${person.lastName}`)
                    .join(', ')}
                </span>
                {data.outToday.laterThisWeek > 0
                  ? t('admin.out.laterThisWeek', { count: data.outToday.laterThisWeek })
                  : data.outToday.count === 0
                    ? t('admin.out.none')
                    : t('admin.out.noneLater')}
              </Hint>
            )
          }
        />
      </li>
      <li>
        <StatCard
          title={t('admin.reviews.title')}
          value={data && number(data.reviewsDue.upcoming)}
          hint={
            data &&
            (data.reviewsDue.overdue > 0 ? (
              <Hint icon={<ErrorOutlineOutlined aria-hidden fontSize="small" />} tone="error">
                {t('admin.reviews.overdue', { count: data.reviewsDue.overdue })}
              </Hint>
            ) : (
              <Hint icon={<CheckCircleOutlineOutlined aria-hidden fontSize="small" />}>
                {t('admin.reviews.noneOverdue')}
              </Hint>
            ))
          }
        />
      </li>
      <li>
        <StatCard
          title={t('admin.movements.title')}
          value={
            data &&
            t('admin.movements.value', {
              joining: number(data.movements.joining),
              leaving: number(data.movements.leaving),
            })
          }
          hint={
            data && (
              <Hint icon={<EventOutlined aria-hidden fontSize="small" />}>
                {next ? (
                  <span>
                    <Link
                      component={RouterLink}
                      to={employeeProfilePath(next.employeeId)}
                      color="inherit"
                    >
                      {`${next.person.firstName} ${next.person.lastName}`}
                    </Link>{' '}
                    {t(
                      next.kind === 'JOINING' ? 'admin.movements.starts' : 'admin.movements.leaves',
                      {
                        date: day(next.date),
                      },
                    )}
                  </span>
                ) : (
                  t('admin.movements.none')
                )}
              </Hint>
            )
          }
        />
      </li>
    </ul>
  );
}
