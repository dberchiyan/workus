import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';
import TrendingFlatOutlined from '@mui/icons-material/TrendingFlatOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

export interface DeltaLineProps {
  /** Positive = up; null = nothing to compare with. */
  direction: number | null;
  /** "+3", "−1.5 %" — the change as text. */
  change: string;
  previousYear: number;
  /** Which way is good; colour follows it, the arrow and sign always say the direction. */
  better: 'up' | 'down';
}

/** "↗ +3 vs 2025": the change against the previous year, never colour alone. */
export function DeltaLine({ direction, change, previousYear, better }: DeltaLineProps) {
  const { t } = useTranslation('insights');
  if (direction === null) {
    return null;
  }
  if (direction === 0) {
    return (
      <Typography variant="body2" color="textSecondary" className="flex items-center gap-1">
        <TrendingFlatOutlined aria-hidden fontSize="small" />
        {t('common.noChange', { year: previousYear })}
      </Typography>
    );
  }
  const good = direction > 0 === (better === 'up');
  const Icon = direction > 0 ? TrendingUpOutlined : TrendingDownOutlined;
  return (
    <Typography
      variant="body2"
      color={good ? 'success' : 'error'}
      className="app-tabular flex items-center gap-1"
    >
      <Icon aria-hidden fontSize="small" />
      {change} {t('common.vsYear', { year: previousYear })}
    </Typography>
  );
}
