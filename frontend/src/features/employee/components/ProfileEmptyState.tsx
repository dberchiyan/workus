import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export interface ProfileEmptyStateProps {
  icon: ReactNode;
  title: string;
  hint?: string;
}

export function ProfileEmptyState({ icon, title, hint }: ProfileEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <span aria-hidden className="text-text-disabled">
        {icon}
      </span>
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      {hint && (
        <Typography variant="body2" color="textSecondary">
          {hint}
        </Typography>
      )}
    </div>
  );
}
