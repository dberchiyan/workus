import { Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage, RequireAccess, RequireAuth } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { EmployeeProfilePage, EmployeesPage } from '@/features/employee/core';
import { AppLayout, SectionPlaceholderPage } from '@/features/shell';
import { InsightsPage } from '@/features/insights';
import { CalendarPage, RequestsPage } from '@/features/time-off';
import { PageLoader } from '@/shared/components/PageLoader';
import { RouteErrorBoundary } from '@/shared/components/RouteErrorBoundary';
import { PATHS } from '@/shared/lib/paths';

const route = (element: ReactNode): ReactNode => (
  <RouteErrorBoundary>
    <Suspense fallback={<PageLoader />}>{element}</Suspense>
  </RouteErrorBoundary>
);

export const router = createBrowserRouter([
  { path: PATHS.login, element: route(<LoginPage />) },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Each section behind its part of ACCESS (features/auth/access.ts) — the same entry
          // that shows or hides its menu item.
          { path: PATHS.dashboard, element: route(<DashboardPage />) },
          {
            element: <RequireAccess part="section.calendar" />,
            children: [{ path: PATHS.calendar, element: route(<CalendarPage />) }],
          },
          {
            element: <RequireAccess part="section.settings" />,
            children: [
              {
                path: PATHS.settings,
                element: route(<SectionPlaceholderPage section="settings" />),
              },
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
  { path: '*', element: <Navigate to={PATHS.dashboard} replace /> },
]);
