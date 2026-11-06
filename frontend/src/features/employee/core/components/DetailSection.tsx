import Typography from '@mui/material/Typography';
import { type ReactNode, useId } from 'react';
import { useTranslation } from 'react-i18next';

export interface DetailRow {
  key: string;
  label: string;
  /** null/empty → "Not provided". */
  value: ReactNode;
}

export interface DetailSectionProps {
  title: string;
  icon: ReactNode;
  rows: readonly DetailRow[];
}

/** A titled section of label/value pairs (a real <dl>). */
export function DetailSection({ title, icon, rows }: DetailSectionProps) {
  const { t } = useTranslation('employee');
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-md bg-badge-active-background text-badge-active-text"
        >
          {icon}
        </span>
        <Typography id={headingId} variant="h6" component="h2">
          {title}
        </Typography>
      </div>
      <dl className="m-0 divide-y divide-divider">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-4 sm:px-6"
          >
            {/* 14rem: one-off label column width for this list. */}
            <Typography variant="body2" component="dt" color="textSecondary">
              {row.label}
            </Typography>
            <Typography variant="body2" component="dd" className="m-0 [overflow-wrap:anywhere]">
              {row.value === null || row.value === '' ? (
                <Typography variant="body2" component="span" color="textSecondary">
                  {t('profile.values.notProvided')}
                </Typography>
              ) : (
                row.value
              )}
            </Typography>
          </div>
        ))}
      </dl>
    </section>
  );
}
