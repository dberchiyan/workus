import { cn } from '@/shared/lib/cn';

export interface BrandMarkProps {
  className?: string;
}

/** The Workus "W" mark — decorative; the product name is always shown as text beside it. */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('size-12 shrink-0', className)}
      aria-hidden
      focusable="false"
    >
      <rect width="48" height="48" rx="12" className="fill-secondary dark:fill-background-paper" />
      <path
        d="M9 14h6l3.9 14.6L23 14h2l4.1 14.6L33 14h6l-7.4 21h-5L24 25.8 21.4 35h-5z"
        className="fill-primary-light"
      />
    </svg>
  );
}
