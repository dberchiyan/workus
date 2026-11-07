import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { cn } from '@/shared/lib/cn';
import { shiftMonth } from '@/shared/lib/month';

export interface MonthSwitcherProps {
  /** `YYYY-MM`. */
  month: string;
  onChange: (month: string) => void;
  locale: string;
  previousLabel: string;
  nextLabel: string;
  /** Heading level of the month name where it titles a section. */
  headingComponent?: 'h2' | 'h3' | 'span';
  className?: string;
}

/** "‹ November 2026 ›" — the month name is announced politely when it changes. */
export function MonthSwitcher({
  month,
  onChange,
  locale,
  previousLabel,
  nextLabel,
  headingComponent = 'span',
  className,
}: MonthSwitcherProps) {
  const label = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));
  return (
    <Card className={cn('flex w-fit items-center gap-1 px-1 py-1', className)}>
      <IconButton
        aria-label={previousLabel}
        onClick={() => {
          onChange(shiftMonth(month, -1));
        }}
      >
        <ChevronLeftOutlined />
      </IconButton>
      <Typography
        variant="subtitle1"
        component={headingComponent}
        aria-live="polite"
        className="app-tabular min-w-36 text-center"
      >
        {label}
      </Typography>
      <IconButton
        aria-label={nextLabel}
        onClick={() => {
          onChange(shiftMonth(month, 1));
        }}
      >
        <ChevronRightOutlined />
      </IconButton>
    </Card>
  );
}
