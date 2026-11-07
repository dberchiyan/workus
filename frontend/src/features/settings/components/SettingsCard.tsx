import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export interface SettingsCardProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

/** One titled block of a settings section. */
export function SettingsCard({ id, title, description, action, children }: SettingsCardProps) {
  return (
    <Card component="section" aria-labelledby={id} className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Typography id={id} variant="h6" component="h2">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="textSecondary">
              {description}
            </Typography>
          )}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </Card>
  );
}
