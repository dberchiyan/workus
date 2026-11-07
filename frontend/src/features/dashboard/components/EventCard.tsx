import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import type { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

const SKELETON_ROWS = ['a', 'b'];

export interface EventCardProps {
  id: string;
  icon: ComponentType<SvgIconProps>;
  /** Theme tone classes: solid for the header tile, light for the empty state's. */
  tone: { solid: string; light: string };
  title: string;
  subtitle?: string;
  /** Undefined while loading. */
  count: string | undefined;
  action?: ReactNode;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  empty: { title: string; text: string };
  /** Pagination under the rows. */
  footer?: ReactNode;
  children: ReactNode;
}

/** A titled event list with its count; loading, error and empty states in the body. */
export function EventCard(props: EventCardProps) {
  const { t } = useTranslation('dashboard');
  const { icon: Icon, tone } = props;
  return (
    <Card component="section" aria-labelledby={props.id} className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full text-avatar-text',
              tone.solid,
            )}
          >
            <Icon fontSize="small" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2">
              <Typography id={props.id} variant="subtitle1" component="h3">
                {props.title}
              </Typography>
              {props.count !== undefined && (
                <Typography
                  variant="caption"
                  component="span"
                  className="app-tabular min-w-6 rounded-full bg-badge-active-background px-2 text-center text-badge-active-text"
                >
                  {props.count}
                </Typography>
              )}
            </span>
            {props.subtitle && (
              <Typography variant="body2" color="textSecondary">
                {props.subtitle}
              </Typography>
            )}
          </div>
        </div>
        {props.action}
      </div>
      <div aria-busy={props.isLoading} className="flex flex-1 flex-col">
        {props.isError ? (
          <Alert
            severity="error"
            className="m-4"
            action={
              <Button color="inherit" size="small" onClick={props.onRetry}>
                {t('admin.retry')}
              </Button>
            }
          >
            {t('events.error')}
          </Alert>
        ) : props.isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {SKELETON_ROWS.map((key) => (
              <Skeleton key={key} variant="rounded" height={40} />
            ))}
          </div>
        ) : props.isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 py-8 text-center">
            <span
              aria-hidden
              className={cn('rounded-xl mb-2 flex size-12 items-center justify-center', tone.light)}
            >
              <Icon />
            </span>
            <Typography variant="subtitle2" component="p">
              {props.empty.title}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {props.empty.text}
            </Typography>
          </div>
        ) : (
          <>
            {props.children}
            {props.footer}
          </>
        )}
      </div>
    </Card>
  );
}
