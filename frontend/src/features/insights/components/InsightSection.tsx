import InfoOutlined from '@mui/icons-material/InfoOutlined';
import TableRowsOutlined from '@mui/icons-material/TableRowsOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface InsightSectionProps {
  id: string;
  title: string;
  subtitle: string;
  isLoading: boolean;
  isError: boolean;
  /** An older answer is on screen while the new one loads. */
  isStale: boolean;
  onRetry: () => void;
  /** Charts offer a table view (values readable without colour). */
  table?: { shown: boolean; onToggle: () => void };
  children: ReactNode;
  /** The headline: number, label, change. */
  figure: ReactNode;
  about: { title: string; text: string };
  /** More side content (a breakdown, the selected month's people). */
  aside?: ReactNode;
}

/** A figure's card (title, chart or list) with its side card (headline, about, details). */
export function InsightSection(props: InsightSectionProps) {
  const { t } = useTranslation('insights');
  return (
    <section
      aria-labelledby={props.id}
      // One-off geometry: the side card keeps a readable fixed width next to the chart.
      className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <Card className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Typography id={props.id} variant="h6" component="h2">
              {props.title}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {props.subtitle}
            </Typography>
          </div>
          {props.table && (
            <ToggleButton
              value="table"
              size="small"
              selected={props.table.shown}
              onChange={props.table.onToggle}
              aria-label={t('common.tableLabel')}
              className="gap-1.5 px-3"
            >
              <TableRowsOutlined aria-hidden fontSize="small" />
              {t('common.table')}
            </ToggleButton>
          )}
        </div>
        <div
          aria-busy={props.isLoading || props.isStale}
          className={props.isStale ? 'p-4 opacity-60 sm:p-6' : 'p-4 sm:p-6'}
        >
          {props.isError ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={props.onRetry}>
                  {t('common.retry')}
                </Button>
              }
            >
              {t('common.error')}
            </Alert>
          ) : props.isLoading ? (
            <Skeleton variant="rounded" height={256} />
          ) : (
            props.children
          )}
        </div>
      </Card>
      <aside aria-labelledby={`${props.id}-about`}>
        <Card className="flex h-full flex-col gap-4 p-5 sm:p-6">
          {props.isLoading ? <Skeleton variant="text" width="50%" height={56} /> : props.figure}
          <div className="flex flex-col gap-1.5 border-t border-divider pt-4">
            <Typography
              id={`${props.id}-about`}
              variant="subtitle2"
              component="h3"
              className="flex items-center gap-1.5"
            >
              <InfoOutlined aria-hidden fontSize="small" color="primary" />
              {props.about.title}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {props.about.text}
            </Typography>
          </div>
          {!props.isLoading && props.aside}
        </Card>
      </aside>
    </section>
  );
}
