import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';

import { cn } from '@/shared/lib/cn';

import { formatPeriod } from '../format';
import type { CalendarRequest } from '../types';
import { TYPE_VISUALS } from './time-off-visuals';

const LABEL_MIN_DAYS = 3;

export interface CalendarBarProps {
    request: CalendarRequest;
    span: number;
    href: string | undefined;
}

/**
 * One request across its days. Approved: the type's tint and coloured icon; pending: grey with a
 * dashed outline — never colour alone, the text says the status.
 */
export function CalendarBar({ request, span, href }: CalendarBarProps): ReactElement {
    const { t, i18n } = useTranslation('timeOff');
    const { icon: Icon, text, tint } = TYPE_VISUALS[request.type];
    const pending = request.status === 'PENDING';
    const description = t('calendar.bar', {
        type: t(`types.${request.type}`),
        status: t(`status.${request.status}`),
        period: formatPeriod(request.startsAt, request.endsAt, i18n.language),
        days: t('requests.days', { count: request.days }),
    });
    const className = cn(
        'relative mx-0.5 flex h-9 min-w-0 items-center gap-1 overflow-hidden rounded-md px-1.5 no-underline',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
        pending
            ? 'border border-dashed border-text-disabled bg-badge-neutral-background text-text-secondary'
            : cn(tint, text, 'dark:text-text-primary'),
    );
    const content = (
        <>
            <Icon aria-hidden fontSize="small" className="shrink-0" />
            {span >= LABEL_MIN_DAYS && (
                <Typography variant="caption" component="span" color="textPrimary" aria-hidden className="truncate">
                    {t(`types.${request.type}`)}
                </Typography>
            )}
            <span className="sr-only">{description}</span>
        </>
    );

    const details = (
        <span className="flex flex-col gap-0.5 py-0.5">
            <span className="flex items-center gap-1.5">
                <Icon aria-hidden fontSize="small" />
                <Typography variant="subtitle2" component="span" color="inherit">
                    {t(`types.${request.type}`)}
                </Typography>
            </span>
            <Typography variant="body2" component="span" color="inherit">
                {formatPeriod(request.startsAt, request.endsAt, i18n.language)}
            </Typography>
            <Typography variant="caption" component="span" color="inherit" className="opacity-80">
                {t('calendar.barDetails', {
                    days: t('requests.days', { count: request.days }),
                    status: t(`status.${request.status}`),
                })}
            </Typography>
        </span>
    );

    return (
        <Tooltip title={details} describeChild>
            {href ? (
                <RouterLink to={href} className={className}>
                    {content}
                </RouterLink>
            ) : (
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                <span tabIndex={0} className={className}>
                    {content}
                </span>
            )}
        </Tooltip>
    );
}
