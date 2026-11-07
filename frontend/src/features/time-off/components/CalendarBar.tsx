import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { requestPath } from '@/shared/lib/paths';
import { formatPeriod } from '../format';
import type { CalendarRequest } from '../types';
import { TYPE_VISUALS } from './timeOffVisuals';

/** Wide enough for the type's name next to its icon. */
const LABEL_MIN_DAYS = 3;

export interface CalendarBarProps {
  request: CalendarRequest;
  /** Days of this month the bar covers. */
  span: number;
  /** Admins open the request; others see its details in the tooltip. */
  linkToRequest: boolean;
}

/**
 * One request across its days. Approved: the type's tint and coloured icon; pending: grey with a
 * dashed outline — never colour alone, the text says the status.
 */
export function CalendarBar({ request, span, linkToRequest }: CalendarBarProps) {
  const { t, i18n } = useTranslation('timeOff');
  const { icon: Icon, text, tint } = TYPE_VISUALS[request.type];
  const pending = request.status === 'PENDING';
  const description = t('calendar.bar', {
    type: t(`types.${request.type}`),
    status: t(`status.${request.status}`),
    period: formatPeriod(request.startDate, request.endDate, i18n.language),
    days: t('requests.days', { count: request.days }),
  });
  const className = cn(
    'relative mx-0.5 flex h-9 min-w-0 items-center gap-1 overflow-hidden rounded-md px-1.5 no-underline',
    'outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
    pending
      ? 'border border-dashed border-text-disabled bg-badge-neutral-background text-text-secondary'
      : // The muted tones are too dark for an icon on the dark theme's tint.
        cn(tint, text, 'dark:text-text-primary'),
  );
  const content = (
    <>
      <Icon aria-hidden fontSize="small" className="shrink-0" />
      {span >= LABEL_MIN_DAYS && (
        <Typography
          variant="caption"
          component="span"
          color="textPrimary"
          aria-hidden
          className="truncate"
        >
          {t(`types.${request.type}`)}
        </Typography>
      )}
      <span className="sr-only">{description}</span>
    </>
  );

  return (
    <Tooltip title={description} describeChild>
      {linkToRequest ? (
        <RouterLink to={requestPath(request.id)} className={className}>
          {content}
        </RouterLink>
      ) : (
        // A focusable tooltip trigger (WAI-ARIA tooltip pattern) so keyboard users get the details.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        <span tabIndex={0} className={className}>
          {content}
        </span>
      )}
    </Tooltip>
  );
}
