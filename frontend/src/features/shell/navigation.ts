import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ComponentType } from 'react';
import type { AccessPart } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { EmployeesPage } from '@/features/employee/core';
import { InsightsPage } from '@/features/insights';
import { CompaniesPage } from '@/features/platform';
import { SettingsPage } from '@/features/settings';
import { CalendarPage, RequestsPage } from '@/features/time-off';
import { PATHS } from '@/shared/lib/paths';

export const NavSection = {
  DASHBOARD: 'dashboard',
  EMPLOYEES: 'employees',
  REQUESTS: 'requests',
  CALENDAR: 'calendar',
  INSIGHTS: 'insights',
  COMPANIES: 'companies',
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
  /** Loads the page's code on hover or focus, so the click renders at once. */
  preload: () => Promise<unknown>;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    section: NavSection.COMPANIES,
    path: PATHS.platform,
    icon: BusinessOutlined,
    access: 'section.companies',
    placement: 'main',
    preload: CompaniesPage.preload,
  },
  {
    section: NavSection.DASHBOARD,
    path: PATHS.dashboard,
    icon: DashboardOutlined,
    access: 'section.dashboard',
    placement: 'main',
    preload: DashboardPage.preload,
  },
  {
    section: NavSection.EMPLOYEES,
    path: PATHS.employees,
    icon: PeopleAltOutlined,
    access: 'section.employees',
    placement: 'main',
    preload: EmployeesPage.preload,
  },
  {
    section: NavSection.REQUESTS,
    path: PATHS.requests,
    icon: InboxOutlined,
    access: 'section.requests',
    placement: 'main',
    preload: RequestsPage.preload,
  },
  {
    section: NavSection.CALENDAR,
    path: PATHS.calendar,
    icon: CalendarMonthOutlined,
    access: 'section.calendar',
    placement: 'main',
    preload: CalendarPage.preload,
  },
  {
    section: NavSection.INSIGHTS,
    path: PATHS.insights,
    icon: InsightsOutlined,
    access: 'section.insights',
    placement: 'main',
    preload: InsightsPage.preload,
  },
  {
    section: NavSection.SETTINGS,
    path: PATHS.settings,
    icon: SettingsOutlined,
    access: 'section.settings',
    placement: 'bottom',
    preload: SettingsPage.preload,
  },
];
