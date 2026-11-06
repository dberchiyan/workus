import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ComponentType } from 'react';
import type { CurrentUser } from '@/features/auth';
import { PATHS } from '@/shared/lib/paths';

export type UserRole = CurrentUser['role'];

export const NavSection = {
  DASHBOARD: 'dashboard',
  EMPLOYEES: 'employees',
  TIME_OFF: 'timeOff',
  CALENDAR: 'calendar',
  INSIGHTS: 'insights',
  SETTINGS: 'settings',
} as const;
export type NavSection = (typeof NavSection)[keyof typeof NavSection];

export interface NavItem {
  section: NavSection;
  path: string;
  icon: ComponentType<SvgIconProps>;
  /** Roles that see the item. Hiding is cosmetic — the backend enforces access. */
  roles: readonly UserRole[];
  placement: 'main' | 'bottom';
}

const EVERYONE: readonly UserRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE'];
export const ADMIN_ONLY: readonly UserRole[] = ['ADMIN'];

export const NAV_ITEMS: readonly NavItem[] = [
  {
    section: NavSection.DASHBOARD,
    path: PATHS.dashboard,
    icon: DashboardOutlined,
    roles: EVERYONE,
    placement: 'main',
  },
  {
    section: NavSection.EMPLOYEES,
    path: PATHS.employees,
    icon: PeopleAltOutlined,
    roles: ADMIN_ONLY,
    placement: 'main',
  },
  {
    section: NavSection.TIME_OFF,
    path: PATHS.timeOff,
    icon: EventBusyOutlined,
    roles: ADMIN_ONLY,
    placement: 'main',
  },
  {
    section: NavSection.CALENDAR,
    path: PATHS.calendar,
    icon: CalendarMonthOutlined,
    roles: EVERYONE,
    placement: 'main',
  },
  {
    section: NavSection.INSIGHTS,
    path: PATHS.insights,
    icon: InsightsOutlined,
    roles: ADMIN_ONLY,
    placement: 'main',
  },
  {
    section: NavSection.SETTINGS,
    path: PATHS.settings,
    icon: SettingsOutlined,
    roles: EVERYONE,
    placement: 'bottom',
  },
];
