import AddOutlined from '@mui/icons-material/AddOutlined';
import AutorenewOutlined from '@mui/icons-material/AutorenewOutlined';
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { todayUtcIso } from '@/shared/lib/utcDay';
import { isWeekendIso } from '../calendar';
import { useHolidays } from '../hooks/useHolidays';
import type { Holiday } from '../types';
import { DeleteHolidayDialog } from './DeleteHolidayDialog';
import { HolidayDialog } from './HolidayDialog';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4'];

type Editing =
  | { kind: 'add'; key: number }
  | { kind: 'edit'; holiday: Holiday; key: number }
  | { kind: 'delete'; holiday: Holiday; key: number };

/** The date as a small calendar tile: month over day number, the weekday under it. */
function DateTile({ date, locale }: { date: string; locale: string }) {
  const day = new Date(`${date}T00:00:00Z`);
  const part = (options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(day);
  return (
    <span
      aria-hidden
      className="flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-md border border-divider"
    >
      <Typography
        variant="caption"
        component="span"
        className="w-full bg-error/10 text-center text-error uppercase"
      >
        {part({ month: 'short' })}
      </Typography>
      <Typography variant="h6" component="span" className="app-tabular">
        {part({ day: 'numeric' })}
      </Typography>
      <Typography variant="caption" component="span" color="textSecondary" className="pb-0.5">
        {part({ weekday: 'short' })}
      </Typography>
    </span>
  );
}

/**
 * Settings → Holidays (admin): the company's non-working days, a year at a time. A recurring
 * holiday is copied to the next year; each year's copy is changed on its own.
 */
export function HolidaysSection() {
  const { t, i18n } = useTranslation('timeOff');
  const titleId = useId();
  const today = todayUtcIso();
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [open, setOpen] = useState(false);
  const holidays = useHolidays(year);
  const locale = i18n.language;
  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' });

  const start = (next: Editing): void => {
    setEditing(next);
    setOpen(true);
  };
  const close = (): void => {
    setOpen(false);
  };
  const exited = (): void => {
    setEditing(null);
  };
  // A new holiday starts on today in the current year, on 1 January in another one.
  const defaultDate = year === currentYear ? today : `${String(year)}-01-01`;

  return (
    <Card component="section" aria-labelledby={titleId} className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Typography id={titleId} variant="h6" component="h2">
            {t('holidays.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('holidays.subtitle')}
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddOutlined aria-hidden />}
          onClick={() => {
            start({ kind: 'add', key: Date.now() });
          }}
        >
          {t('holidays.add')}
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2 border-b border-divider px-2 py-1 sm:px-4">
        <div className="flex items-center">
          <IconButton
            aria-label={t('holidays.previousYear')}
            onClick={() => {
              setYear(year - 1);
            }}
          >
            <ChevronLeftOutlined />
          </IconButton>
          <Typography
            variant="subtitle1"
            component="h3"
            aria-live="polite"
            className="app-tabular min-w-14 text-center"
          >
            {year}
          </Typography>
          <IconButton
            aria-label={t('holidays.nextYear')}
            onClick={() => {
              setYear(year + 1);
            }}
          >
            <ChevronRightOutlined />
          </IconButton>
        </div>
        {holidays.data && (
          <Typography variant="body2" color="textSecondary" className="pr-2">
            {t('holidays.count', { count: holidays.data.length })}
          </Typography>
        )}
      </div>

      {holidays.isError ? (
        <div className="p-4 sm:p-6">
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void holidays.refetch()}>
                {t('holidays.retry')}
              </Button>
            }
          >
            {t('holidays.error')}
          </Alert>
        </div>
      ) : !holidays.data ? (
        <ul aria-busy="true" className="m-0 list-none p-0">
          <li className="sr-only">{t('holidays.loading')}</li>
          {SKELETON_ROWS.map((key) => (
            <li
              key={key}
              className="flex items-center gap-4 border-b border-divider px-4 py-3 sm:px-6"
            >
              <Skeleton variant="rounded" className="h-16 w-14" />
              <Skeleton variant="text" className="w-48" />
            </li>
          ))}
        </ul>
      ) : holidays.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <EventAvailableOutlined aria-hidden color="disabled" />
          <Typography variant="subtitle2">{t('holidays.empty', { year })}</Typography>
          <Typography variant="body2" color="textSecondary">
            {t('holidays.emptyHint')}
          </Typography>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {holidays.data.map((holiday) => (
            <li
              key={holiday.id}
              className="flex items-center gap-4 border-b border-divider px-4 py-3 last:border-b-0 sm:px-6"
            >
              <DateTile date={holiday.date} locale={locale} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography variant="subtitle2" component="p" className="[overflow-wrap:anywhere]">
                  <span className="sr-only">{`${fullDate.format(new Date(`${holiday.date}T00:00:00Z`))}: `}</span>
                  {holiday.name}
                </Typography>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    className="flex items-center gap-1"
                  >
                    {holiday.recurring && <AutorenewOutlined aria-hidden fontSize="inherit" />}
                    {holiday.recurring ? t('holidays.everyYear') : t('holidays.thisYearOnly')}
                  </Typography>
                  {isWeekendIso(holiday.date) && (
                    <Typography variant="caption" color="textSecondary">
                      {t('holidays.onWeekend')}
                    </Typography>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <IconButton
                  aria-label={t('holidays.edit', { name: holiday.name })}
                  onClick={() => {
                    start({ kind: 'edit', holiday, key: Date.now() });
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label={t('holidays.remove', { name: holiday.name })}
                  onClick={() => {
                    start({ kind: 'delete', holiday, key: Date.now() });
                  }}
                >
                  <DeleteOutlineOutlined fontSize="small" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Remounted on each opening, so every dialog starts fresh. */}
      {editing?.kind === 'add' && (
        <HolidayDialog
          key={editing.key}
          holiday={undefined}
          defaultDate={defaultDate}
          open={open}
          onClose={close}
          onExited={exited}
        />
      )}
      {editing?.kind === 'edit' && (
        <HolidayDialog
          key={editing.key}
          holiday={editing.holiday}
          defaultDate={editing.holiday.date}
          open={open}
          onClose={close}
          onExited={exited}
        />
      )}
      {editing?.kind === 'delete' && (
        <DeleteHolidayDialog
          key={editing.key}
          holiday={editing.holiday}
          open={open}
          onClose={close}
          onExited={exited}
        />
      )}
    </Card>
  );
}
