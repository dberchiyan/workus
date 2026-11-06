import { styled } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatCount } from '../format';
import type { CategoryCounts } from '../types';

const ALL = 'all';

/** Compact tab: content-wide, small side padding, still a 44 px touch target. */
const CategoryTab = styled(Tab)(({ theme }) => ({
  minWidth: 0,
  minHeight: theme.spacing(5.5),
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(1),
}));

export interface CategoryTabsProps {
  counts: CategoryCounts | undefined;
  categoryId: string | undefined;
  onChange: (categoryId: string | undefined) => void;
  controlsId: string;
}

/** Tabs come from the categories in the database; each shows how many employees match. */
export function CategoryTabs({ counts, categoryId, onChange, controlsId }: CategoryTabsProps) {
  const { t, i18n } = useTranslation('employee');
  const tabs = [
    { value: ALL, label: t('tabs.all'), count: counts?.total },
    ...(counts?.categories ?? []).map((category) => ({
      value: category.id,
      label: category.name,
      count: category.employeeCount,
    })),
  ];
  const selected = tabs.some((tab) => tab.value === categoryId) ? categoryId : ALL;

  return (
    <Tabs
      value={selected}
      onChange={(_event, value: string) => {
        onChange(value === ALL ? undefined : value);
      }}
      // Scrolls horizontally when the tabs do not fit (phones); no arrow buttons.
      variant="scrollable"
      scrollButtons={false}
      aria-label={t('tabs.label')}
      slotProps={{ indicator: { className: 'h-0.5' } }}
      className="min-h-11 border-b border-divider"
    >
      {tabs.map((tab) => {
        const isSelected = tab.value === selected;
        return (
          <CategoryTab
            key={tab.value}
            value={tab.value}
            aria-controls={controlsId}
            label={
              <span className="flex items-center gap-2">
                <Typography variant="subtitle2" component="span">
                  {tab.label}
                </Typography>
                {tab.count !== undefined && (
                  <Typography
                    variant="caption"
                    component="span"
                    className={cn(
                      'app-tabular min-w-6 rounded-full px-2 text-center',
                      isSelected
                        ? 'bg-badge-active-background text-badge-active-text'
                        : 'bg-badge-neutral-background text-badge-neutral-text',
                    )}
                  >
                    {formatCount(tab.count, i18n.language)}
                  </Typography>
                )}
              </span>
            }
          />
        );
      })}
    </Tabs>
  );
}
