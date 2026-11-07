import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatCount, formatDay } from '../format';
import type { LeaveBalance } from '../types';
import { TYPE_VISUALS } from './timeOffVisuals';

export interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  /** The card title's heading level within the page. */
  headingLevel: 'h2' | 'h3';
}

/** Days available and used in the current cycle; "available" is omitted when unlimited. */
export function LeaveBalanceCard({ balance, headingLevel }: LeaveBalanceCardProps) {
  const { t, i18n } = useTranslation('timeOff');
  const { icon: Icon, tone } = TYPE_VISUALS[balance.type];
  const stats = [
    ...(balance.available === null
      ? []
      : [{ key: 'available', label: t('balances.available'), value: balance.available }]),
    { key: 'used', label: t('balances.used'), value: balance.used },
  ];
  const note =
    balance.pending > 0
      ? t('balances.pending', { count: balance.pending })
      : balance.allowance === null
        ? t('balances.noLimit')
        : null;
  return (
    <Card variant="outlined" className="h-full">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-md text-avatar-text',
              tone,
            )}
          >
            <Icon fontSize="small" />
          </span>
          <div className="flex min-w-0 flex-col">
            <Typography variant="subtitle1" component={headingLevel}>
              {t(`cardTitles.${balance.type}`)}
            </Typography>
            <Typography variant="caption" color="textSecondary" className="app-tabular">
              {t('balances.cycle', {
                start: formatDay(balance.cycleStart, i18n.language),
                end: formatDay(balance.cycleEnd, i18n.language),
              })}
            </Typography>
          </div>
        </div>
        <dl className="m-0 grid flex-1 auto-cols-fr grid-flow-col items-end divide-x divide-divider">
          {stats.map((stat) => (
            <div key={stat.key} className="flex flex-col-reverse items-center gap-1 px-2">
              <Typography variant="caption" component="dt" color="textSecondary">
                {stat.label}
              </Typography>
              <Typography variant="h4" component="dd" className="app-tabular m-0">
                {formatCount(stat.value, i18n.language)}
              </Typography>
            </div>
          ))}
        </dl>
        {/* Reserved line, so cards in a row keep one height; stacked on a phone, an empty one
            would only leave a gap. */}
        <Typography
          variant="caption"
          color="textSecondary"
          className={cn('text-center', note === null && 'hidden sm:block')}
        >
          {note ?? '\u00A0'}
        </Typography>
      </CardContent>
    </Card>
  );
}
