import Link from '@mui/material/Link';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { ThemeModeToggle } from '@/shared/components/ThemeModeToggle';

export interface PageShellProps {
  children: ReactNode;
  /** Extra controls placed before the theme toggle in the top bar. */
  actions?: ReactNode;
  className?: string;
}

/** Skip link, top bar and the page's single <main> landmark. */
export function PageShell({ children, actions, className }: PageShellProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Link
        href="#main"
        className="absolute top-2 left-2 z-10 -translate-y-24 rounded-sm bg-background-paper p-3 focus-visible:translate-y-0"
      >
        {t('a11y.skipToContent')}
      </Link>
      {/* Arbitrary value: safe-area inset for notched devices (one-off geometry). */}
      <header className="flex items-center justify-end gap-2 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] md:px-8">
        {actions}
        <ThemeModeToggle />
      </header>
      <main id="main" tabIndex={-1} className={cn('flex flex-1 flex-col outline-none', className)}>
        {children}
      </main>
    </div>
  );
}
