import DevicesOutlined from '@mui/icons-material/DevicesOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';

/** Settings sections, in menu order; each has its own URL (/settings/<section>). */
export const SETTINGS_SECTIONS = [
  { key: 'account', icon: PersonOutlineOutlined },
  { key: 'sessions', icon: DevicesOutlined },
  { key: 'security', icon: ShieldOutlined },
  { key: 'preferences', icon: TuneOutlined },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]['key'];

export const isSettingsSection = (value: string | undefined): value is SettingsSection =>
  SETTINGS_SECTIONS.some((section) => section.key === value);
