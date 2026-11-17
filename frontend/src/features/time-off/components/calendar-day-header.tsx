import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { ISO_DAY_OF_MONTH_START } from '@/shared/lib/units';

import { isWeekendIso } from '../calendar';

export interface CalendarDayHeaderProps {
    date: string;
    today: boolean;
    holiday?: string | undefined;
    weekday: string;
    ref?: Ref<HTMLTableCellElement>;
}

/** Day number over its short weekday; today in the primary colour with a dot. */
export function CalendarDayHeader({ date, today, holiday, weekday, ref }: CalendarDayHeaderProps): ReactElement {
    const { t } = useTranslation('timeOff');
    const header = (
        <th
            ref={ref}
            scope="col"
            aria-current={today ? 'date' : undefined}
            className={cn(
                'font-normal relative border-b border-l border-divider px-0 pt-3 pb-2 text-center',
                isWeekendIso(date) && 'bg-badge-neutral-background/60',
                holiday !== undefined && 'bg-error/10 text-error',
                today && 'bg-primary/10 text-primary',
            )}
        >
            {today && (
                <span aria-hidden className="absolute top-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
            )}
            <Typography variant="subtitle2" component="span" color="inherit" className="app-tabular block">
                {Number(date.slice(ISO_DAY_OF_MONTH_START))}
            </Typography>
            <Typography
                variant="caption"
                component="span"
                color={today || holiday !== undefined ? 'inherit' : 'textSecondary'}
                className="block uppercase"
            >
                {weekday}
            </Typography>
            {holiday !== undefined && <span className="sr-only">{t('calendar.page.holiday', { name: holiday })}</span>}
        </th>
    );
    return holiday === undefined ? (
        header
    ) : (
        <Tooltip title={holiday} describeChild={false}>
            {header}
        </Tooltip>
    );
}
