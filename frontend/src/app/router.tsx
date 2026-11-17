import { type ReactNode, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import { LoginPage, RequireAccess, RequireAuth } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { EmployeeProfilePage, EmployeesPage } from '@/features/employee/core';
import { InsightsPage } from '@/features/insights';
import { OrganisationGate, SignupPage } from '@/features/organisation';
import { CompaniesPage, CompanyPage } from '@/features/platform';
import { SettingsPage } from '@/features/settings';
import { AppLayout } from '@/features/shell';
import { CalendarPage, RequestsPage } from '@/features/time-off';
import { PageLoader } from '@/shared/components/page-loader';
import { RouteErrorBoundary } from '@/shared/components/route-error-boundary';
import { PATHS } from '@/shared/lib/paths';

const route = (element: ReactNode): ReactNode => (
    <RouteErrorBoundary>
        <Suspense fallback={<PageLoader />}>{element}</Suspense>
    </RouteErrorBoundary>
);

export const router = createBrowserRouter([
    { path: PATHS.login, element: route(<LoginPage />) },
    { path: PATHS.signup, element: route(<SignupPage />) },
    {
        element: <RequireAuth />,
        children: [
            {
                element: <OrganisationGate />,
                children: [
                    {
                        element: <AppLayout />,
                        children: [
                            {
                                element: <RequireAccess part="section.dashboard" />,
                                children: [{ path: PATHS.dashboard, element: route(<DashboardPage />) }],
                            },
                            {
                                element: <RequireAccess part="section.companies" />,
                                children: [
                                    { path: PATHS.platform, element: route(<CompaniesPage />) },
                                    { path: PATHS.platformCompany, element: route(<CompanyPage />) },
                                ],
                            },
                            {
                                element: <RequireAccess part="section.calendar" />,
                                children: [{ path: PATHS.calendar, element: route(<CalendarPage />) }],
                            },
                            {
                                element: <RequireAccess part="section.settings" />,
                                children: [
                                    { path: PATHS.settings, element: route(<SettingsPage />) },
                                    { path: PATHS.settingsSection, element: route(<SettingsPage />) },
                                ],
                            },
                            {
                                element: <RequireAccess part="section.employees" />,
                                children: [
                                    { path: PATHS.employees, element: route(<EmployeesPage />) },
                                    { path: PATHS.employeeProfile, element: route(<EmployeeProfilePage />) },
                                ],
                            },
                            {
                                element: <RequireAccess part="section.requests" />,
                                children: [{ path: PATHS.requests, element: route(<RequestsPage />) }],
                            },
                            {
                                element: <RequireAccess part="section.insights" />,
                                children: [{ path: PATHS.insights, element: route(<InsightsPage />) }],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    { path: '*', element: <Navigate to={PATHS.dashboard} replace /> },
]);
