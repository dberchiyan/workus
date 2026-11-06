import { useCurrentUser } from '@/features/auth';
import { NAV_ITEMS, type NavItem } from '../navigation';

/** Menu items for the signed-in user's role, split into the main list and the bottom group. */
export const useNavigationItems = (): { main: NavItem[]; bottom: NavItem[] } => {
  const { data: user } = useCurrentUser();
  const visible = user ? NAV_ITEMS.filter((item) => item.roles.includes(user.role)) : [];
  return {
    main: visible.filter((item) => item.placement === 'main'),
    bottom: visible.filter((item) => item.placement === 'bottom'),
  };
};
