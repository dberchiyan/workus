import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatCalendarDate, formatCount } from '../format';
import type { LeaveBalance } from '../mocks/employeeProfileMock';

export interface LeaveBalanceCardProps {
  title: string;
  icon: ReactNode;
  /** Tailwind background class from the avatar tones (theme tokens). */
  toneClass: string;
  balance: LeaveBalance;
}

/** Days available and used in the current cycle; "available" is omitted when unlimited. */
export function LeaveBalanceCard({ title, icon, toneClass, balance }: LeaveBalanceCardProps) {
  const { t, i18n } = useTranslation('employee');
  const date = (iso: string) => formatCalendarDate(iso, i18n.language);
  const stats = [
    ...(balance.available === null
      ? []
      : [{ key: 'available', label: t('profile.leave.available'), value: balance.available }]),
    { key: 'used', label: t('profile.leave.used'), value: balance.used },
  ];
  return (
    <Card variant="outlined">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              'flex size-9 items-center justify-center rounded-md text-avatar-text',
              toneClass,
            )}
          >
            {icon}
          </span>
          <div className="flex min-w-0 flex-col">
            <Typography variant="subtitle1" component="h2">
              {title}
            </Typography>
            <Typography variant="caption" color="textSecondary" className="app-tabular">
              {t('profile.leave.cycle', {
                start: date(balance.cycleStart),
                end: date(balance.cycleEnd),
              })}
            </Typography>
          </div>
        </div>
        <dl className="m-0 grid auto-cols-fr grid-flow-col divide-x divide-divider">
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
      </CardContent>
    </Card>
  );
}
