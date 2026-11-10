import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import DevicesOutlined from '@mui/icons-material/DevicesOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import type { AccessPart } from '@/features/auth';

/** The menu's groups, in order: the person's own settings, then the company's. */
export const SETTINGS_GROUPS = ['you', 'company'] as const;
export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

/** Settings sections, in menu order; each has its own URL (/settings/<section>). */
export const SETTINGS_SECTIONS = [
  { key: 'account', group: 'you', icon: PersonOutlineOutlined },
  { key: 'sessions', group: 'you', icon: DevicesOutlined },
  { key: 'security', group: 'you', icon: ShieldOutlined },
  /** Owners only (ACCESS 'settings.organisation'). */
  { key: 'organisation', group: 'company', icon: BusinessOutlined },
  /** Admins and owners (ACCESS 'settings.structure'). */
  { key: 'structure', group: 'company', icon: AccountTreeOutlined },
  /** Admins only (ACCESS 'settings.holidays'). */
  { key: 'holidays', group: 'company', icon: CelebrationOutlined },
  /** Admins and owners (ACCESS 'settings.administrators'). */
  { key: 'administrators', group: 'company', icon: AdminPanelSettingsOutlined },
] as const satisfies readonly { key: string; group: SettingsGroup; icon: unknown }[];

/** Sections only some roles use, and the part of ACCESS that decides. */
const SECTION_ACCESS: Partial<Record<SettingsSection, AccessPart>> = {
  holidays: 'settings.holidays',
  structure: 'settings.structure',
  organisation: 'settings.organisation',
  administrators: 'settings.administrators',
};

/** The ACCESS part a section needs; none → everyone signed in. */
export const sectionAccessPart = (section: SettingsSection): AccessPart | undefined =>
  SECTION_ACCESS[section];

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]['key'];

export const isSettingsSection = (value: string | undefined): value is SettingsSection =>
  SETTINGS_SECTIONS.some((section) => section.key === value);
