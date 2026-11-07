import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { todayUtcIso } from '@/shared/lib/utcDay';
import { useAccess } from '@/features/auth';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { usePageHeadingFocus } from '@/shared/hooks/usePageHeadingFocus';
import { CalendarGrid } from '../components/CalendarGrid';
import { CalendarToolbar } from '../components/CalendarToolbar';
import { formatCount } from '../format';
import { useCalendar } from '../hooks/useCalendar';
import { CALENDAR_PAGE_SIZES, useCalendarParams } from '../hooks/useCalendarParams';

/** Who is away and when: everyone's approved time off and requests still waiting (grey). */
export default function CalendarPage() {
  const { t, i18n } = useTranslation('timeOff');
  // Today (UTC, as everywhere), fixed for the visit (no clock in render).
  const [today] = useState(todayUtcIso);
  const currentMonth = today.slice(0, 7);
  const { params, update } = useCalendarParams(currentMonth);
  const calendar = useCalendar(params);
  const can = useAccess();
  useDocumentTitle(t('calendar.page.title'));
  const headingRef = usePageHeadingFocus<HTMLHeadingElement>();

  const onSearch = useCallback(
    (search: string) => {
      update({ search });
    },
    [update],
  );

  const data = calendar.data;
  // A month or filter change keeps the old grid until the new one arrives.
  const rows =
    calendar.isPlaceholderData && data?.from.slice(0, 7) !== params.month
      ? undefined
      : data?.content;
  const holidays = new Map((rows ? (data?.holidays ?? []) : []).map((day) => [day.date, day.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography
          ref={headingRef}
          tabIndex={-1}
          variant="h4"
          component="h1"
          className="outline-none"
        >
          {t('calendar.page.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('calendar.page.subtitle')}
        </Typography>
      </div>
      <CalendarToolbar
        month={params.month}
        currentMonth={currentMonth}
        types={params.types}
        onMonth={(month) => {
          update({ month });
        }}
        onTypes={(types) => {
          update({ types });
        }}
      />
      {calendar.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void calendar.refetch()}>
              {t('calendar.page.retry')}
            </Button>
          }
        >
          {t('calendar.page.error')}
        </Alert>
      ) : (
        <Card aria-busy={calendar.isFetching} className="overflow-hidden">
          <CalendarGrid
            month={params.month}
            today={today}
            rows={rows}
            holidays={holidays}
            search={params.search}
            canOpenRequest={can('calendar.openRequest')}
            canOpenProfile={can('calendar.openProfile')}
            onSearch={onSearch}
          />
          {data && (data.totalElements > params.size || params.page > 0) && (
            <TablePagination
              component="div"
              className="border-t border-divider"
              count={data.totalElements}
              page={params.page}
              rowsPerPage={params.size}
              rowsPerPageOptions={[...CALENDAR_PAGE_SIZES]}
              onPageChange={(_event, page) => {
                update({ page });
              }}
              onRowsPerPageChange={(event) => {
                update({ size: Number(event.target.value) });
              }}
              labelRowsPerPage={t('calendar.page.rowsPerPage')}
              labelDisplayedRows={({ from, to, count }) =>
                t('calendar.page.displayed', {
                  from: formatCount(from, i18n.language),
                  to: formatCount(to, i18n.language),
                  count: formatCount(count, i18n.language),
                })
              }
            />
          )}
        </Card>
      )}
    </div>
  );
}
