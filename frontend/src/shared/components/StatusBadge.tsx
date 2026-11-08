import Typography from '@mui/material/Typography';
import { cn } from '@/shared/lib/cn';

/** Success = done / active, warning = waiting, info = planned, danger = refused, neutral = ended. */
export type StatusTone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

/** Literal class names so Tailwind sees them (theme/tokens.ts → status). */
const TONES: Record<StatusTone, { badge: string; dot: string }> = {
  success: {
    badge: 'bg-status-success-background text-status-success-text',
    dot: 'bg-status-success-dot',
  },
  warning: {
    badge: 'bg-status-warning-background text-status-warning-text',
    dot: 'bg-status-warning-dot',
  },
  info: { badge: 'bg-status-info-background text-status-info-text', dot: 'bg-status-info-dot' },
  danger: {
    badge: 'bg-status-danger-background text-status-danger-text',
    dot: 'bg-status-danger-dot',
  },
  neutral: {
    badge: 'bg-status-neutral-background text-status-neutral-text',
    dot: 'bg-status-neutral-dot',
  },
};

export interface StatusBadgeProps {
  tone: StatusTone;
  /** The status in words — it carries the meaning; tone and dot only support it. */
  label: string;
  className?: string;
}

/** One look for every status in the app: a soft pill, a dot in the tone, the word. */
export function StatusBadge({ tone, label, className }: StatusBadgeProps) {
  const { badge, dot } = TONES[tone];
  return (
    <Typography
      variant="caption"
      component="span"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 whitespace-nowrap',
        badge,
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', dot)} />
      {label}
    </Typography>
  );
}
