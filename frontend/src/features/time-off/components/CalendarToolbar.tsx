import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { MonthSwitcher } from '@/shared/components/MonthSwitcher';
import { cn } from '@/shared/lib/cn';
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
        <MonthSwitcher
          month={month}
          onChange={onMonth}
          locale={i18n.language}
          previousLabel={t('calendar.page.previous')}
          nextLabel={t('calendar.page.next')}
          headingComponent="h2"
        />
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
