import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { addMonths } from '../calendar';
import { TIME_OFF_TYPES, type TimeOffType } from '../types';
import { NOT_EMPLOYED_PATTERN, TYPE_VISUALS } from './timeOffVisuals';

export interface CalendarToolbarProps {
  month: string;
  currentMonth: string;
  types: TimeOffType[];
  onMonth: (month: string) => void;
  onTypes: (types: TimeOffType[]) => void;
}

/** Month switcher on the left; type toggles (also the legend) and the pending key on the right. */
export function CalendarToolbar({
  month,
  currentMonth,
  types,
  onMonth,
  onTypes,
}: CalendarToolbarProps) {
  const { t, i18n } = useTranslation('timeOff');
  const label = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));

  const toggle = (type: TimeOffType) => {
    const next = types.includes(type) ? types.filter((item) => item !== type) : [...types, type];
    // At least one type stays on — an empty calendar would look like nobody is away.
    if (next.length > 0) {
      onTypes(TIME_OFF_TYPES.filter((item) => next.includes(item)));
    }
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <Card className="flex items-center gap-1 px-1 py-1">
          <IconButton
            aria-label={t('calendar.page.previous')}
            onClick={() => {
              onMonth(addMonths(month, -1));
            }}
          >
            <ChevronLeftOutlined />
          </IconButton>
          <Typography
            variant="subtitle1"
            component="h2"
            aria-live="polite"
            className="app-tabular min-w-36 text-center"
          >
            {label}
          </Typography>
          <IconButton
            aria-label={t('calendar.page.next')}
            onClick={() => {
              onMonth(addMonths(month, 1));
            }}
          >
            <ChevronRightOutlined />
          </IconButton>
        </Card>
        {month !== currentMonth && (
          <Button
            variant="outlined"
            onClick={() => {
              onMonth(currentMonth);
            }}
          >
            {t('calendar.page.today')}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t('calendar.page.types')} className="flex flex-wrap gap-2">
          {TIME_OFF_TYPES.map((type) => {
            const { icon: Icon, tone } = TYPE_VISUALS[type];
            const selected = types.includes(type);
            return (
              <ToggleButton
                key={type}
                value={type}
                selected={selected}
                onChange={() => {
                  toggle(type);
                }}
                className="gap-2 py-1 pr-3 pl-1"
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-8 items-center justify-center rounded-md',
                    selected
                      ? cn(tone, 'text-avatar-text')
                      : 'bg-badge-neutral-background text-text-secondary',
                  )}
                >
                  <Icon fontSize="small" />
                </span>
                {t(`types.${type}`)}
              </ToggleButton>
            );
          })}
        </div>
        <Typography
          variant="body2"
          color="textSecondary"
          component="span"
          className="flex items-center gap-2 px-2"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-md border border-dashed border-text-disabled bg-badge-neutral-background"
          >
            <HourglassEmptyOutlined fontSize="small" />
          </span>
          {t('calendar.page.pendingKey')}
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          component="span"
          className="flex items-center gap-2 px-2"
        >
          <span
            aria-hidden
            className={cn('size-8 rounded-md border border-divider', NOT_EMPLOYED_PATTERN)}
          />
          {t('calendar.page.notEmployedKey')}
        </Typography>
      </div>
    </div>
  );
}
