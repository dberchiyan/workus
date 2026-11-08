import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { NavLink, useMatch } from 'react-router';
import { cn } from '@/shared/lib/cn';
import type { NavItem } from '../navigation';

export interface NavItemLinkProps {
  item: NavItem;
  /** Rail mode: icon only, label in a tooltip and the accessible name. */
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export function NavItemLink({ item, isCollapsed, onNavigate }: NavItemLinkProps) {
  const { t } = useTranslation('shell');
  // A section stays active on its sub-pages (/settings/sessions, /employees/:id); the Dashboard
  // ('/') only on itself.
  const exact = item.path === '/';
  const isActive = useMatch({ path: item.path, end: exact }) !== null;
  const label = t(`nav.${item.section}`);
  const Icon = item.icon;

  const link = (
    <ListItemButton
      component={NavLink}
      to={item.path}
      end={exact}
      onClick={onNavigate}
      onMouseEnter={() => void item.preload()}
      onFocus={() => void item.preload()}
      aria-label={isCollapsed ? label : undefined}
      className={cn(
        'relative min-h-12 gap-3 rounded-sm px-3 text-sidebar-text hover:bg-sidebar-hover',
        isCollapsed && 'justify-center px-0',
        isActive && 'bg-sidebar-active text-sidebar-active-text hover:bg-sidebar-active',
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-1 rounded-sm bg-sidebar-indicator"
        />
      )}
      <ListItemIcon className="min-w-0 text-inherit">
        <Icon aria-hidden />
      </ListItemIcon>
      {!isCollapsed && <ListItemText primary={label} />}
    </ListItemButton>
  );

  return isCollapsed ? (
    <Tooltip title={label} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
