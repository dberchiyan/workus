import BeachAccessOutlined from '@mui/icons-material/BeachAccessOutlined';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import LocalHospitalOutlined from '@mui/icons-material/LocalHospitalOutlined';
import type { TimeOffType } from '../types';

/**
 * One icon and avatar tone (theme tokens) per type, the same on cards, chips and the profile.
 * The tones keep ≥ 5:1 against white, so they also work as icon colours (≥ 3:1 needed); `tint` is
 * the same tone, light, behind a coloured icon (calendar bars).
 */
export const TYPE_VISUALS = {
  VACATION: {
    icon: BeachAccessOutlined,
    tone: 'bg-avatar-c2',
    text: 'text-avatar-c2',
    tint: 'bg-avatar-c2/15 dark:bg-avatar-c2/40',
  },
  SICK_DAY: {
    icon: LocalHospitalOutlined,
    tone: 'bg-avatar-c4',
    text: 'text-avatar-c4',
    tint: 'bg-avatar-c4/15 dark:bg-avatar-c4/40',
  },
  DAY_OFF: {
    icon: EventBusyOutlined,
    tone: 'bg-avatar-c5',
    text: 'text-avatar-c5',
    tint: 'bg-avatar-c5/15 dark:bg-avatar-c5/40',
  },
} as const satisfies Record<TimeOffType, unknown>;

/**
 * Hatching for days outside employment (calendar cells and their legend key). One-off geometry:
 * thin divider-coloured diagonals 6px apart.
 */
export const NOT_EMPLOYED_PATTERN =
  'bg-[repeating-linear-gradient(135deg,var(--color-divider)_0_1px,transparent_1px_6px)]';
