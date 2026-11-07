import ToggleButton from '@mui/material/ToggleButton';
import { cn } from '@/shared/lib/cn';

export interface ChartLegendProps {
  label: string;
  items: { key: string; label: string; className: string; hidden: boolean }[];
  /** Absent → a plain legend; present → each item shows or hides its series. */
  onToggle?: (key: string) => void;
}

/** Swatch + name per series; the names carry identity, colour only supports them. */
export function ChartLegend({ label, items, onToggle }: ChartLegendProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const swatch = (
          <span
            aria-hidden
            className={cn(
              'size-2.5 shrink-0 rounded-full',
              item.hidden ? 'bg-text-disabled' : item.className,
            )}
          />
        );
        return onToggle ? (
          <ToggleButton
            key={item.key}
            value={item.key}
            size="small"
            selected={!item.hidden}
            onChange={() => {
              onToggle(item.key);
            }}
            className={cn('gap-2 rounded-full px-3 py-1', item.hidden && 'line-through')}
          >
            {swatch}
            {item.label}
          </ToggleButton>
        ) : (
          <span
            key={item.key}
            className="flex items-center gap-2 rounded-full border border-divider px-3 py-1"
          >
            {swatch}
            <span className="app-body2">{item.label}</span>
          </span>
        );
      })}
    </div>
  );
}
