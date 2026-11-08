import { IdleSessionWarning } from '@/features/auth';
import Drawer from '@mui/material/Drawer';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId, useState, ViewTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';
import { TopProgressBar } from '@/shared/components/TopProgressBar';
import { cn } from '@/shared/lib/cn';
import { useIsPageLoading } from '../hooks/useIsPageLoading';
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed';
import { SidebarContent } from './SidebarContent';
import { TopBar } from './TopBar';

/**
 * Signed-in layout (ux.md patterns): desktop — persistent sidebar the person can fold to the
 * icon rail; tablet — icon rail; mobile — temporary drawer opened from the top bar.
 */
export function AppLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  // Behaviour CSS cannot express: which drawer variant is mounted.
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const sidebar = useSidebarCollapsed();
  const isRail = !isDesktop || sidebar.isCollapsed;
  const menuButtonId = useId();
  const { pathname } = useLocation();
  const isPageLoading = useIsPageLoading();

  const closeDrawer = (): void => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <Link
        href="#main"
        className="absolute top-2 left-2 z-50 -translate-y-24 rounded-sm bg-background-paper p-3 focus-visible:translate-y-0"
      >
        {t('a11y.skipToContent')}
      </Link>
      {isTabletUp ? (
        <aside
          className={cn('sticky top-0 h-dvh shrink-0', isRail ? 'w-rail-width' : 'w-sidebar-width')}
        >
          <SidebarContent
            isCollapsed={isRail}
            {...(isDesktop ? { onToggleCollapsed: sidebar.toggle } : {})}
          />
        </aside>
      ) : (
        <Drawer
          open={isDrawerOpen}
          onClose={closeDrawer}
          slotProps={{ paper: { className: 'w-sidebar-width max-w-[85vw] border-0' } }}
        >
          {/* max-w in vw above: the drawer never covers the whole screen on 320 px. */}
          <SidebarContent isCollapsed={false} onNavigate={closeDrawer} />
        </Drawer>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          {...(isTabletUp
            ? {}
            : {
                onOpenMenu: () => {
                  setIsDrawerOpen(true);
                },
              })}
          menuButtonId={menuButtonId}
          isMenuOpen={isDrawerOpen}
        />
        <main
          id="main"
          tabIndex={-1}
          className="flex flex-1 flex-col px-4 py-6 outline-none md:px-8 md:py-8"
        >
          {/* One content width for every signed-in page (theme token `container-page`). */}
          <div className="mx-auto flex w-full max-w-page flex-1 flex-col">
            {/* Navigations run in a transition: the old page slides out, the new one in (CSS in
                theme/tailwind.css); keyed by path, so filters and tabs (search params) don't. */}
            <ViewTransition key={pathname} enter="page-enter" exit="page-exit" default="none">
              <Outlet />
            </ViewTransition>
          </div>
        </main>
        {isPageLoading && <TopProgressBar />}
        <IdleSessionWarning />
      </div>
    </div>
  );
}
