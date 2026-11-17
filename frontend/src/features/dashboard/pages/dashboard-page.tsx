import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAccess, useCurrentUser } from '@/features/auth';
import { MyTimeOff } from '@/features/time-off';
import { useDocumentTitle } from '@/shared/hooks/use-document-title';
import { usePageHeadingFocus } from '@/shared/hooks/use-page-heading-focus';

import { AdminEvents } from '../components/admin-events';
import { AdminOverview } from '../components/admin-overview';

/**
 * Admins: what needs attention (requests, absences, reviews, people starting / leaving), then
 * today's events and events by month (requests made, reviews, birthdays).
 * Employees and managers: their time off (balances and requests).
 */
export function DashboardPage(): ReactElement | null {
    const { t } = useTranslation('dashboard');
    useDocumentTitle(t('pageTitle'));
    const headingRef = usePageHeadingFocus<HTMLHeadingElement>();
    const { data: user } = useCurrentUser();
    const can = useAccess();

    if (!user) {
        return null;
    }

    return (
        <div className="flex flex-col gap-6">
            <Typography ref={headingRef} tabIndex={-1} variant="h4" component="h1" className="sr-only">
                {t('title')}
            </Typography>
            {can('dashboard.companyOverview') && (
                <>
                    <AdminOverview />
                    <AdminEvents />
                </>
            )}
            {can('dashboard.ownTimeOff') && <MyTimeOff />}
        </div>
    );
}
