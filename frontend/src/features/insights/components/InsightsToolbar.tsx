import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { FIRST_YEAR } from '../hooks/useInsightsParams';
import type { CategoryCounts, InsightsFilter } from '../types';

const ALL = 'all';

export interface InsightsToolbarProps {
  filter: InsightsFilter;
  currentYear: number;
  categories: CategoryCounts['categories'];
  onChange: (changes: Partial<InsightsFilter>) => void;
}

/** Category and year for every figure on the page. */
export function InsightsToolbar({
  filter,
  currentYear,
  categories,
  onChange,
}: InsightsToolbarProps) {
  const { t } = useTranslation('insights');
  return (
    <div className="flex flex-wrap items-center gap-3">
      <TextField
        select
        size="small"
        label={t('filters.category')}
        value={filter.categoryId ?? ALL}
        onChange={(event) => {
          onChange({ categoryId: event.target.value === ALL ? undefined : event.target.value });
        }}
        className="min-w-56"
      >
        <MenuItem value={ALL}>{t('filters.allCategories')}</MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </TextField>
      <Card className="flex items-center gap-1 px-1 py-1">
        <IconButton
          aria-label={t('filters.previousYear')}
          disabled={filter.year <= FIRST_YEAR}
          onClick={() => {
            onChange({ year: filter.year - 1 });
          }}
        >
          <ChevronLeftOutlined />
        </IconButton>
        <Typography
          variant="subtitle1"
          component="span"
          aria-live="polite"
          aria-label={`${t('filters.year')} ${String(filter.year)}`}
          className="app-tabular min-w-14 text-center"
        >
          {filter.year}
        </Typography>
        <IconButton
          aria-label={t('filters.nextYear')}
          disabled={filter.year >= currentYear}
          onClick={() => {
            onChange({ year: filter.year + 1 });
          }}
        >
          <ChevronRightOutlined />
        </IconButton>
      </Card>
    </div>
  );
}
