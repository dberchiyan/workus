import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import CreditCardOutlined from '@mui/icons-material/CreditCardOutlined';
import DevicesOutlined from '@mui/icons-material/DevicesOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';

import type { AccessPart } from '@/features/auth';

export const SETTINGS_GROUPS = ['you', 'company'] as const;
export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

export const SETTINGS_SECTIONS = [
    { key: 'account', group: 'you', icon: PersonOutlineOutlined },
    { key: 'sessions', group: 'you', icon: DevicesOutlined },
    { key: 'security', group: 'you', icon: ShieldOutlined },
    { key: 'organisation', group: 'company', icon: BusinessOutlined },
    { key: 'billing', group: 'company', icon: CreditCardOutlined },
    { key: 'structure', group: 'company', icon: AccountTreeOutlined },
    { key: 'holidays', group: 'company', icon: CelebrationOutlined },
    { key: 'administrators', group: 'company', icon: AdminPanelSettingsOutlined },
] as const satisfies readonly { key: string; group: SettingsGroup; icon: unknown }[];

const SECTION_ACCESS: Partial<Record<SettingsSection, AccessPart>> = {
    holidays: 'settings.holidays',
    structure: 'settings.structure',
    organisation: 'settings.organisation',
    billing: 'settings.billing',
    administrators: 'settings.administrators',
};

/** The ACCESS part a section needs; none → everyone signed in. */
export const sectionAccessPart = (section: SettingsSection): AccessPart | undefined => SECTION_ACCESS[section];

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]['key'];

export const isSettingsSection = (value: string | undefined): value is SettingsSection =>
    SETTINGS_SECTIONS.some((section) => section.key === value);
