import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { formatDay } from '../format';

export interface NotEmployedSpanProps {
  reason: 'before' | 'after';
  employee: { startDate: string; terminatedOn: string | null };
}

/** Fills a hatched run of days; hover or focus says why: not started yet, or no longer employed. */
export function NotEmployedSpan({ reason, employee }: NotEmployedSpanProps) {
  const { t, i18n } = useTranslation('timeOff');
  const date = reason === 'before' ? employee.startDate : employee.terminatedOn;
  const description = date
    ? t(reason === 'before' ? 'calendar.notEmployed.starts' : 'calendar.notEmployed.left', {
        date: formatDay(date, i18n.language),
      })
    : t('calendar.page.notEmployedKey');
  return (
    <Tooltip title={description} describeChild followCursor>
      {/* A focusable tooltip trigger (WAI-ARIA tooltip pattern) so keyboard users get the reason. */}
      <span
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="block h-full w-full outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="sr-only">{description}</span>
      </span>
    </Tooltip>
  );
}
