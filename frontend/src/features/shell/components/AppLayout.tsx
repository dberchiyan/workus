import Drawer from '@mui/material/Drawer';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { SidebarContent } from './SidebarContent';
import { TopBar } from './TopBar';

/**
 * Signed-in layout (ux.md patterns): desktop — persistent sidebar; tablet — icon rail;
 * mobile — temporary drawer opened from the top bar.
 */
export function AppLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  // Behaviour CSS cannot express: which drawer variant is mounted.
  const isTabletUp = useMediaQuery(theme.breakpoints.up('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuButtonId = useId();

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
          className={cn(
            'sticky top-0 h-dvh shrink-0',
            isDesktop ? 'w-sidebar-width' : 'w-rail-width',
          )}
        >
          <SidebarContent isCollapsed={!isDesktop} />
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
