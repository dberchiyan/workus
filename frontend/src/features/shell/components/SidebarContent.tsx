import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/shared/components/BrandMark';
import { cn } from '@/shared/lib/cn';
import { useNavigationItems } from '../hooks/useNavigationItems';
import { NavItemLink } from './NavItemLink';

export interface SidebarContentProps {
  isCollapsed: boolean;
  onNavigate?: () => void;
}

/** Brand, main items and the separate bottom group (Settings). */
export function SidebarContent({ isCollapsed, onNavigate }: SidebarContentProps) {
  const { t } = useTranslation(['common', 'shell']);
  const { main, bottom } = useNavigationItems();

  return (
    <nav
      aria-label={t('shell:nav.label')}
      className="flex h-full flex-col gap-6 bg-sidebar-background px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {/* Arbitrary value above: safe-area inset for devices with a home indicator. */}
      <div
        className={cn(
          'flex min-h-12 items-center gap-3 px-1',
          isCollapsed && 'justify-center px-0',
        )}
      >
        <BrandMark className="size-9" />
        {!isCollapsed && (
          <Typography variant="h6" component="p" className="text-sidebar-active-text">
            {t('app.name')}
          </Typography>
        )}
      </div>
      <List disablePadding className="flex flex-1 flex-col gap-1">
        {main.map((item) => (
          <li key={item.section}>
            <NavItemLink
              item={item}
              isCollapsed={isCollapsed}
              {...(onNavigate ? { onNavigate } : {})}
            />
          </li>
        ))}
      </List>
      <List disablePadding className="flex flex-col gap-1 border-t border-sidebar-hover pt-3">
        {bottom.map((item) => (
          <li key={item.section}>
            <NavItemLink
              item={item}
              isCollapsed={isCollapsed}
              {...(onNavigate ? { onNavigate } : {})}
            />
          </li>
        ))}
      </List>
    </nav>
  );
}
