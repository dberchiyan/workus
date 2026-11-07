import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export interface FigureProps {
  value: string;
  label: string;
  delta?: ReactNode;
}

/** The side card's headline: a big number, what it is, how it changed. */
export function Figure({ value, label, delta }: FigureProps) {
  return (
    <div className="flex flex-col gap-1">
      <Typography variant="metric" color="primary" className="app-tabular">
        {value}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {label}
      </Typography>
      {delta}
    </div>
  );
}
