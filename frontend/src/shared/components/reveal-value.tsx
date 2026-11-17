import { type ReactNode, useState } from 'react';

export interface RevealValueProps {
    value: string | undefined;
    fallback?: ReactNode;
}

/**
 * A figure that rises in when it arrives after loading or changes (a new year, a filter) — the
 * real value only, never counting through made-up ones (ux.md). A value already there when the
 * card mounts (from the cache) shows at once.
 */
export function RevealValue({ value, fallback }: RevealValueProps): ReactNode {
    const [atMount] = useState(value);
    if (value === undefined) {
        return fallback;
    }
    return (
        <span key={value} className={value === atMount ? undefined : 'app-value-in inline-block'}>
            {value}
        </span>
    );
}
