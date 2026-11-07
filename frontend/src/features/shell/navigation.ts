import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ComponentType } from 'react';
import type { AccessPart } from '@/features/auth';
import { PATHS } from '@/shared/lib/paths';

export const NavSection = {
  DASHBOARD: 'dashboard',
  EMPLOYEES: 'employees',
  REQUESTS: 'requests',
  CALENDAR: 'calendar',
  INSIGHTS: 'insights',
  SETTINGS: 'settings',
} as const;
export type NavSection = (typeof NavSection)[keyof typeof NavSection];

export interface NavItem {
  section: NavSection;
  path: string;
  icon: ComponentType<SvgIconProps>;
  /** The part of `ACCESS` that decides who sees it (cosmetic — the backend enforces access). */
  access: AccessPart;
  placement: 'main' | 'bottom';
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    section: NavSection.DASHBOARD,
    path: PATHS.dashboard,
    icon: DashboardOutlined,
    access: 'section.dashboard',
    placement: 'main',
  },
  {
    section: NavSection.EMPLOYEES,
    path: PATHS.employees,
    icon: PeopleAltOutlined,
    access: 'section.employees',
    placement: 'main',
  },
  {
    section: NavSection.REQUESTS,
    path: PATHS.requests,
    icon: InboxOutlined,
    access: 'section.requests',
    placement: 'main',
  },
  {
    section: NavSection.CALENDAR,
    path: PATHS.calendar,
    icon: CalendarMonthOutlined,
    access: 'section.calendar',
    placement: 'main',
  },
  {
    section: NavSection.INSIGHTS,
    path: PATHS.insights,
    icon: InsightsOutlined,
    access: 'section.insights',
    placement: 'main',
  },
  {
    section: NavSection.SETTINGS,
    path: PATHS.settings,
    icon: SettingsOutlined,
    access: 'section.settings',
    placement: 'bottom',
  },
];
