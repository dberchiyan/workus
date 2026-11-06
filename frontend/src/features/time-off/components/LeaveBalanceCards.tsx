import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { LeaveBalances } from '../types';
import { TIME_OFF_TYPES } from '../types';
import { LeaveBalanceCard } from './LeaveBalanceCard';

export interface LeaveBalanceCardsProps {
  data: LeaveBalances | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  headingLevel: 'h2' | 'h3';
  /** Layout of the cards: a row (dashboard) or a column (profile side). */
  layout: 'row' | 'column';
}

/** Vacation, sick days, days off — with loading and error states. */
export function LeaveBalanceCards({
  data,
  isPending,
  isError,
  onRetry,
  headingLevel,
  layout,
}: LeaveBalanceCardsProps) {
  const { t } = useTranslation('timeOff');
  const grid = cn(
    'grid gap-4',
    layout === 'row' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1',
  );
  if (isPending) {
    return (
      <div className={grid} aria-busy="true">
        <span className="sr-only">{t('balances.loading')}</span>
        {TIME_OFF_TYPES.map((type) => (
          <Skeleton key={type} variant="rounded" className="h-40" />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t('balances.retry')}
          </Button>
        }
      >
        {t('balances.error')}
      </Alert>
    );
  }
  const ordered = TIME_OFF_TYPES.flatMap((type) =>
    data.content.filter((balance) => balance.type === type),
  );
  return (
    <ul className={cn('m-0 list-none p-0', grid)}>
      {ordered.map((balance) => (
        <li key={balance.type}>
          <LeaveBalanceCard balance={balance} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
