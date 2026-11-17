import type { ReactElement } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export interface EventListProps {
    paged: boolean;
    stale: boolean;
    children: ReactNode;
}

/** The rows of an event card; a container, so rows switch layout by the card's width. */
export function EventList({ paged, stale, children }: EventListProps): ReactElement {
    return (
        <ul className={cn('@container m-0 list-none p-0', paged && 'min-h-80', stale && 'opacity-60')}>{children}</ul>
    );
}
