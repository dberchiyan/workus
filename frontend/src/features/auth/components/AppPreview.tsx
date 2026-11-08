import Paper from '@mui/material/Paper';
import { m, useReducedMotion } from 'motion/react';
import { BrandMark } from '@/shared/components/BrandMark';
import { cn } from '@/shared/lib/cn';

const MENU = ['menu-1', 'menu-2', 'menu-3', 'menu-4', 'menu-5'] as const;
/** Bar widths of the stat tiles' figures and the mini chart's columns (percent). */
const TILES = ['w-2/5', 'w-1/4'] as const;
/** Distinct heights — they double as keys. */
const COLUMNS = [40, 65, 50, 80, 60, 95, 75] as const;
/** People rows: an avatar tone, a status tone, how many responsible avatars. */
const ROWS = [
  { id: 'row-1', avatar: 'bg-avatar-c1', name: 'w-2/5', status: 'success', stack: 2 },
  { id: 'row-2', avatar: 'bg-avatar-c4', name: 'w-1/3', status: 'warning', stack: 1 },
  { id: 'row-3', avatar: 'bg-avatar-c2', name: 'w-1/2', status: 'success', stack: 3 },
  { id: 'row-4', avatar: 'bg-avatar-c5', name: 'w-1/3', status: 'neutral', stack: 1 },
] as const;
const STACK = ['bg-avatar-c7', 'bg-avatar-c3', 'bg-avatar-c6'] as const;

const STATUS = {
  success: {
    pill: 'bg-status-success-background text-status-success-text',
    dot: 'bg-status-success-dot',
  },
  warning: {
    pill: 'bg-status-warning-background text-status-warning-text',
    dot: 'bg-status-warning-dot',
  },
  neutral: {
    pill: 'bg-status-neutral-background text-status-neutral-text',
    dot: 'bg-status-neutral-dot',
  },
} as const;

/** A text line in the preview: no words, just its shape. */
const Line = ({ className }: { className: string }) => (
  <div className={cn('h-2 rounded-full', className)} />
);

/**
 * Decorative product preview beside the sign-in card (desktop only): the real app's shapes and
 * colours — light sidebar, stat tiles, people with status badges and responsible avatars — and
 * a notice floating in. Motion comes from the page's LazyMotion.
 */
export function AppPreview() {
  const reduce = useReducedMotion();
  return (
    <m.div
      aria-hidden
      initial={reduce ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
      className="relative hidden w-full max-w-2xl self-center lg:block"
    >
      <Paper elevation={12} className="overflow-hidden">
        {/* Window bar */}
        <div className="flex items-center gap-1.5 border-b border-divider px-4 py-3">
          <span className="size-2.5 rounded-full bg-divider" />
          <span className="size-2.5 rounded-full bg-divider" />
          <span className="size-2.5 rounded-full bg-divider" />
          <span className="mx-auto h-5 w-2/5 rounded-full bg-background" />
        </div>
        <div className="flex h-96">
          <div className="flex w-1/5 flex-col gap-3 border-r border-sidebar-border bg-sidebar-background p-4">
            <BrandMark className="mb-2 size-7" />
            {MENU.map((id, index) => (
              <div
                key={id}
                className={cn('rounded-md px-2 py-1.5', index === 0 && 'bg-sidebar-active')}
              >
                <Line
                  className={index === 0 ? 'w-3/4 bg-sidebar-indicator' : 'w-full bg-divider'}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-4 bg-background p-5">
            <Line className="h-3 w-1/3 bg-text-primary opacity-70" />
            <div className="grid grid-cols-3 gap-3">
              {TILES.map((width) => (
                <div
                  key={width}
                  className="flex flex-col gap-2 rounded-md border border-divider bg-background-paper p-3"
                >
                  <Line className="w-1/2 bg-divider" />
                  <div className={cn('h-4 rounded-sm bg-text-primary opacity-80', width)} />
                </div>
              ))}
              <div className="flex items-end gap-1 rounded-md border border-divider bg-background-paper p-3">
                {COLUMNS.map((height, index) => (
                  <m.div
                    key={height}
                    initial={reduce ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.04, ease: [0.2, 0, 0, 1] }}
                    className="flex-1 origin-bottom rounded-t-sm bg-chart-c1"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col divide-y divide-divider rounded-md border border-divider bg-background-paper">
              {ROWS.map((row) => (
                <div key={row.id} className="flex flex-1 items-center gap-3 px-4">
                  <span className={cn('size-7 shrink-0 rounded-full', row.avatar)} />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Line className={cn('bg-text-primary opacity-60', row.name)} />
                    <Line className="w-1/4 bg-divider" />
                  </div>
                  <span
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2 py-1.5',
                      STATUS[row.status].pill,
                    )}
                  >
                    <span className={cn('size-1.5 rounded-full', STATUS[row.status].dot)} />
                    <span className="h-1.5 w-8 rounded-full bg-current opacity-20" />
                  </span>
                  <span className="flex w-16 justify-end">
                    {STACK.slice(0, row.stack).map((tone) => (
                      <span
                        key={tone}
                        className={cn(
                          'size-5 rounded-full ring-2 ring-background-paper not-first:-ml-1.5',
                          tone,
                        )}
                      />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Paper>
      {/* A notice floats in over the corner. */}
      <m.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6, ease: [0.2, 0, 0, 1] }}
        className="absolute -bottom-6 -left-8 w-60"
      >
        <Paper elevation={8} className="flex items-center gap-3 p-3">
          <span className="size-8 shrink-0 rounded-full bg-avatar-c6" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Line className="w-4/5 bg-text-primary opacity-60" />
            <Line className="w-1/2 bg-divider" />
          </div>
          <span className="size-2 shrink-0 rounded-full bg-status-success-dot" />
        </Paper>
      </m.div>
    </m.div>
  );
}
