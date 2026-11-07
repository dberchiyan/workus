import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import DevicesOutlined from '@mui/icons-material/DevicesOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';

/** Settings sections, in menu order; each has its own URL (/settings/<section>). */
export const SETTINGS_SECTIONS = [
  { key: 'account', icon: PersonOutlineOutlined },
  { key: 'sessions', icon: DevicesOutlined },
  { key: 'security', icon: ShieldOutlined },
  /** Admins only (ACCESS 'settings.holidays'). */
  { key: 'holidays', icon: CelebrationOutlined },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]['key'];

export const isSettingsSection = (value: string | undefined): value is SettingsSection =>
  SETTINGS_SECTIONS.some((section) => section.key === value);
