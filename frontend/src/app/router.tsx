import { Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage, RequireAuth } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { ADMIN_ONLY, AppLayout, RequireRole, SectionPlaceholderPage } from '@/features/shell';
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
          { path: PATHS.dashboard, element: route(<DashboardPage />) },
          { path: PATHS.calendar, element: route(<SectionPlaceholderPage section="calendar" />) },
          { path: PATHS.settings, element: route(<SectionPlaceholderPage section="settings" />) },
          {
            element: <RequireRole roles={ADMIN_ONLY} />,
            children: [
              {
                path: PATHS.employees,
                element: route(<SectionPlaceholderPage section="employees" />),
              },
              { path: PATHS.timeOff, element: route(<SectionPlaceholderPage section="timeOff" />) },
              {
                path: PATHS.insights,
                element: route(<SectionPlaceholderPage section="insights" />),
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={PATHS.dashboard} replace /> },
]);
