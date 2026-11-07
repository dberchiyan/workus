import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface EventListProps {
  /** More than one page: keep five rows' height so the last page does not shrink the card. */
  paged: boolean;
  /** The rows are an older page while the next one loads. */
  stale: boolean;
  children: ReactNode;
}

/** The rows of an event card; a container, so rows switch layout by the card's width. */
export function EventList({ paged, stale, children }: EventListProps) {
  return (
    <ul className={cn('@container m-0 list-none p-0', paged && 'min-h-80', stale && 'opacity-60')}>
      {children}
    </ul>
  );
}
