import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { m, useReducedMotion } from 'motion/react';
import { cn } from '@/shared/lib/cn';
import { niceScale } from '../chart';

export interface ChartColumn {
  key: string;
  /** Under the column: short on wider screens, narrow on phones. */
  label: string;
  narrowLabel: string;
  /** Follow `series`; null = a month that has not started. */
  values: number[] | null;
  /** Tooltip and accessible name. */
  description: string;
}

export interface ColumnsChartProps {
  label: string;
  columns: ChartColumn[];
  series: { key: string; className: string; hidden: boolean }[];
  /** Stacked (parts of a whole) or side by side (two measures). */
  mode: 'stacked' | 'paired';
  selectedKey: string | undefined;
  onSelect: (key: string) => void;
  /** Changes when the data set changes, so the bars grow again. */
  animationKey: string;
}

const PLOT = 'relative h-64';

/** Month columns over a light grid; a column is a button that selects its month. */
export function ColumnsChart(props: ColumnsChartProps) {
  const reduceMotion = useReducedMotion();
  const visible = (values: number[]) => values.filter((_, index) => !props.series[index]?.hidden);
  const maximum = Math.max(
    0,
    ...props.columns.map((column) => {
      if (!column.values) {
        return 0;
      }
      const shown = visible(column.values);
      return props.mode === 'stacked'
        ? shown.reduce((sum, value) => sum + value, 0)
        : Math.max(0, ...shown);
    }),
  );
  const { max, ticks } = niceScale(maximum);
  const grow = (index: number) =>
    reduceMotion
      ? {}
      : {
          initial: { scaleY: 0 },
          animate: { scaleY: 1 },
          transition: { duration: 0.45, delay: index * 0.03, ease: 'easeOut' as const },
        };

  return (
    <div role="group" aria-label={props.label} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div aria-hidden className={cn(PLOT, 'w-8 shrink-0')}>
          {ticks.map((tick) => (
            <Typography
              key={tick}
              variant="caption"
              color="textSecondary"
              className="app-tabular absolute right-0 translate-y-1/2"
              style={{ bottom: `${String((tick / max) * 100)}%` }}
            >
              {tick}
            </Typography>
          ))}
        </div>
        <div className={cn(PLOT, 'min-w-0 flex-1')}>
          {ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden
              className={cn(
                'absolute inset-x-0 border-t',
                tick === 0 ? 'border-text-disabled' : 'border-dashed border-divider',
              )}
              style={{ bottom: `${String((tick / max) * 100)}%` }}
            />
          ))}
          <div className="absolute inset-0 flex">
            {props.columns.map((column, index) => {
              const selected = column.key === props.selectedKey;
              return (
                <Tooltip key={column.key} title={column.description} placement="top" describeChild>
                  <button
                    type="button"
                    disabled={column.values === null}
                    aria-pressed={selected}
                    aria-label={column.description}
                    onClick={() => {
                      props.onSelect(column.key);
                    }}
                    className={cn(
                      'flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end rounded-md border-0 bg-transparent px-0.5 pt-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-default sm:px-1.5',
                      selected && 'bg-primary/10',
                    )}
                  >
                    {column.values && props.mode === 'stacked' && (
                      <m.span
                        key={`${props.animationKey}-${column.key}`}
                        className="flex w-full max-w-10 origin-bottom flex-col-reverse overflow-hidden rounded-t-md"
                        style={{
                          height: `${String((visible(column.values).reduce((a, b) => a + b, 0) / max) * 100)}%`,
                        }}
                        {...grow(index)}
                      >
                        {column.values.map((value, part) =>
                          props.series[part]?.hidden || value === 0 ? null : (
                            <span
                              key={props.series[part]?.key ?? part}
                              className={cn(
                                // A 2px paper gap between parts (dataviz spacer).
                                'block w-full border-t-2 border-background-paper first:border-t-0',
                                props.series[part]?.className,
                              )}
                              style={{ flexGrow: value, flexBasis: 0 }}
                            />
                          ),
                        )}
                      </m.span>
                    )}
                    {column.values && props.mode === 'paired' && (
                      <span className="flex h-full w-full max-w-14 items-end justify-center gap-0.5 sm:gap-1">
                        {column.values.map((value, part) => (
                          <m.span
                            key={`${props.animationKey}-${column.key}-${props.series[part]?.key ?? part}`}
                            className={cn(
                              'block w-1/2 origin-bottom rounded-t-md',
                              props.series[part]?.className,
                            )}
                            style={{ height: `${String((value / max) * 100)}%` }}
                            {...grow(index)}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
      <div aria-hidden className="ml-10 flex">
        {props.columns.map((column) => (
          <Typography
            key={column.key}
            variant="caption"
            color={column.key === props.selectedKey ? 'primary' : 'textSecondary'}
            className="min-w-0 flex-1 text-center"
          >
            <span className="sm:hidden">{column.narrowLabel}</span>
            <span className="hidden sm:inline">{column.label}</span>
          </Typography>
        ))}
      </div>
    </div>
  );
}
