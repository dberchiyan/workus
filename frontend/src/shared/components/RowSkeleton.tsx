import Skeleton from '@mui/material/Skeleton';
import { cn } from '@/shared/lib/cn';

export interface RowSkeletonProps {
  /** What leads the row: a person's avatar (circle), an icon tile, or nothing. */
  leading?: 'avatar' | 'icon' | 'none';
  /** A chip or a date at the end of the row. */
  trailing?: boolean;
  className?: string;
}

/**
 * One list row while it loads, in the shape of the real one (leading mark, a name over a muted
 * line, a trailing chip), so nothing jumps when the data arrives.
 */
export function RowSkeleton({ leading = 'avatar', trailing = true, className }: RowSkeletonProps) {
  return (
    <div aria-hidden className={cn('flex items-center gap-3 py-2', className)}>
      {leading === 'avatar' && <Skeleton variant="circular" className="size-8 shrink-0" />}
      {leading === 'icon' && <Skeleton variant="rounded" className="size-10 shrink-0" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Skeleton variant="text" className="w-2/5 max-w-48" />
        <Skeleton variant="text" className="w-3/5 max-w-72" />
      </div>
      {trailing && <Skeleton variant="rounded" className="h-6 w-16 shrink-0 rounded-full" />}
    </div>
  );
}
