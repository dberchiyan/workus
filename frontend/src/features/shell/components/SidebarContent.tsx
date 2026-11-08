import KeyboardDoubleArrowLeftOutlined from '@mui/icons-material/KeyboardDoubleArrowLeftOutlined';
import KeyboardDoubleArrowRightOutlined from '@mui/icons-material/KeyboardDoubleArrowRightOutlined';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/shared/components/BrandMark';
import { cn } from '@/shared/lib/cn';
import { useNavigationItems } from '../hooks/useNavigationItems';
import { NavItemLink } from './NavItemLink';

export interface SidebarContentProps {
  isCollapsed: boolean;
  onNavigate?: () => void;
  /** Desktop only: folds the sidebar to the icon rail and back. */
  onToggleCollapsed?: () => void;
}

/** Brand, main items and the separate bottom group (Settings, then the fold toggle). */
export function SidebarContent({
  isCollapsed,
  onNavigate,
  onToggleCollapsed,
}: SidebarContentProps) {
  const { t } = useTranslation(['common', 'shell']);
  const { main, bottom } = useNavigationItems();

  return (
    <nav
      aria-label={t('shell:nav.label')}
      className="flex h-full flex-col gap-6 border-r border-sidebar-border bg-sidebar-background px-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {/* Arbitrary value above: safe-area inset for devices with a home indicator. */}
      {/* Brand row: as tall as the top bar, so its rule sits level with the top bar's border; same
          inset as the rule above Settings. */}
      <div
        className={cn(
          'flex h-top-bar-height shrink-0 items-center gap-3 border-b border-sidebar-border px-1',
          isCollapsed && 'justify-center px-0',
        )}
      >
        <BrandMark className="size-9" />
        {!isCollapsed && (
          <Typography variant="h6" component="p" className="text-sidebar-title">
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
      <List disablePadding className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
        {bottom.map((item) => (
          <li key={item.section}>
            <NavItemLink
              item={item}
              isCollapsed={isCollapsed}
              {...(onNavigate ? { onNavigate } : {})}
            />
          </li>
        ))}
        {onToggleCollapsed && (
          <li>
            <CollapseToggle isCollapsed={isCollapsed} onToggle={onToggleCollapsed} />
          </li>
        )}
      </List>
    </nav>
  );
}

function CollapseToggle({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const { t } = useTranslation('shell');
  const label = isCollapsed ? t('menu.expand') : t('menu.collapse');
  const Icon = isCollapsed ? KeyboardDoubleArrowRightOutlined : KeyboardDoubleArrowLeftOutlined;
  const button = (
    <ListItemButton
      onClick={onToggle}
      aria-label={isCollapsed ? label : undefined}
      className={cn(
        'min-h-12 gap-3 rounded-sm px-3 text-sidebar-text hover:bg-sidebar-hover',
        isCollapsed && 'justify-center px-0',
      )}
    >
      <ListItemIcon className="min-w-0 text-inherit">
        <Icon aria-hidden />
      </ListItemIcon>
      {!isCollapsed && <ListItemText primary={label} />}
    </ListItemButton>
  );
  return isCollapsed ? (
    <Tooltip title={label} placement="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
}
