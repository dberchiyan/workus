import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import DevicesOutlined from '@mui/icons-material/DevicesOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import type { AccessPart } from '@/features/auth';

/** Settings sections, in menu order; each has its own URL (/settings/<section>). */
export const SETTINGS_SECTIONS = [
  { key: 'account', icon: PersonOutlineOutlined },
  { key: 'sessions', icon: DevicesOutlined },
  { key: 'security', icon: ShieldOutlined },
  /** Admins only (ACCESS 'settings.holidays'). */
  { key: 'holidays', icon: CelebrationOutlined },
  /** Owners only (ACCESS 'settings.organisation'). */
  { key: 'organisation', icon: BusinessOutlined },
  /** Admins and owners (ACCESS 'settings.administrators'). */
  { key: 'administrators', icon: AdminPanelSettingsOutlined },
] as const;

/** Sections only some roles use, and the part of ACCESS that decides. */
const SECTION_ACCESS: Partial<Record<SettingsSection, AccessPart>> = {
  holidays: 'settings.holidays',
  organisation: 'settings.organisation',
  administrators: 'settings.administrators',
};

/** The ACCESS part a section needs; none → everyone signed in. */
export const sectionAccessPart = (section: SettingsSection): AccessPart | undefined =>
  SECTION_ACCESS[section];

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]['key'];

export const isSettingsSection = (value: string | undefined): value is SettingsSection =>
  SETTINGS_SECTIONS.some((section) => section.key === value);
