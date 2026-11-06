import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  value: string | undefined;
  /** Icon + text under the number; colour never carries the meaning alone. */
  hint?: ReactNode;
}

/** A titled number with a hint line under it (stat rows on Employees and the dashboard). */
export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent className="flex flex-col gap-1 p-4">
        <Typography variant="subtitle2" component="h2" color="textSecondary">
          {title}
        </Typography>
        <Typography variant="metric">{value ?? <Skeleton width="3ch" />}</Typography>
        {hint}
      </CardContent>
    </Card>
  );
}
