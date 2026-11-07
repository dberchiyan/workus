import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  id: string;
  title: string;
  subtitle: string;
  /** Undefined while loading. */
  count: string | undefined;
  children?: ReactNode;
}

/** A section title with its count badge, a line under it and room for controls on the right. */
export function SectionHeader({ id, title, subtitle, count, children }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2">
          <Typography id={id} variant="h5" component="h2">
            {title}
          </Typography>
          {count !== undefined && (
            <Typography
              variant="caption"
              component="span"
              className="app-tabular rounded-full bg-badge-active-background px-2 text-badge-active-text"
            >
              {count}
            </Typography>
          )}
        </span>
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      </div>
      {children}
    </div>
  );
}
