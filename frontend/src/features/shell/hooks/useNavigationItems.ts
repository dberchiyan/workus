import { useAccess } from '@/features/auth';
import { NAV_ITEMS, type NavItem } from '../navigation';

/** Menu items the signed-in user's role uses (see `ACCESS`), split into the main list and the bottom group. */
export const useNavigationItems = (): { main: NavItem[]; bottom: NavItem[] } => {
  const can = useAccess();
  const visible = NAV_ITEMS.filter((item) => can(item.access));
  return {
    main: visible.filter((item) => item.placement === 'main'),
    bottom: visible.filter((item) => item.placement === 'bottom'),
  };
};
