import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';
import TrendingFlatOutlined from '@mui/icons-material/TrendingFlatOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/shared/lib/money';
import { formatPercentChange, formatReviewDate } from '../format';
import type { EmployeeReviews } from '../types';
import { SalaryHistoryChart } from './SalaryHistoryChart';
import { RevealValue } from '@/shared/components/RevealValue';

/** Current salary, change vs the previous completed review, and the history chart. */
export function SalaryOverview({ salary }: { salary: EmployeeReviews['salary'] }) {
  const { t, i18n } = useTranslation('review');
  const locale = i18n.language;
  const previous = salary.history.at(-2);

  if (!salary.current) {
    return (
      <div className="flex flex-col gap-1 px-4 py-5 sm:px-6">
        <Typography variant="subtitle2" component="h3" color="textSecondary">
          {t('salary.title')}
        </Typography>
        <Typography variant="body1">{t('salary.none')}</Typography>
        <Typography variant="body2" color="textSecondary">
          {t('salary.noneHint')}
        </Typography>
      </div>
    );
  }

  const change = salary.changePercent;
  const isUp = change !== null && !change.startsWith('-') && change !== '0.0';
  const isDown = change?.startsWith('-') ?? false;
  const Icon = isUp ? TrendingUpOutlined : isDown ? TrendingDownOutlined : TrendingFlatOutlined;

  return (
    <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:gap-8 sm:px-6">
      <div className="flex shrink-0 flex-col gap-1">
        <Typography variant="subtitle2" component="h3" color="textSecondary">
          {t('salary.title')}
        </Typography>
        <div className="flex items-baseline gap-2">
          <Typography variant="metric" component="p">
            <RevealValue value={formatMoney(salary.current, locale)} />
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('salary.perMonth')}
          </Typography>
        </div>
        {change !== null && previous && (
          <Typography
            variant="body2"
            color={isUp ? undefined : 'textSecondary'}
            className={isUp ? 'flex items-center gap-1 text-success' : 'flex items-center gap-1'}
          >
            <Icon aria-hidden fontSize="small" />
            {t('salary.change', {
              percent: formatPercentChange(change, locale),
              date: formatReviewDate(previous.date, locale),
            })}
          </Typography>
        )}
      </div>
      <div className="w-full min-w-0 sm:flex-1">
        <SalaryHistoryChart history={salary.history} />
      </div>
    </div>
  );
}
