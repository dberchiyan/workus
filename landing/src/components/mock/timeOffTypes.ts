import type { MuiIconName } from '@/components/ui/mui-icons';

/** The app's time-off types: one icon and avatar tone each (as `TYPE_VISUALS` in the app). */
export const TYPES = {
  vacation: {
    icon: 'beach',
    label: 'Vacation',
    text: 'text-avatar-2',
    tone: 'bg-avatar-2',
    tint: 'bg-avatar-2/15',
  },
  sick: {
    icon: 'hospital',
    label: 'Sick day',
    text: 'text-avatar-4',
    tone: 'bg-avatar-4',
    tint: 'bg-avatar-4/15',
  },
  dayOff: {
    icon: 'eventBusy',
    label: 'Day off',
    text: 'text-avatar-5',
    tone: 'bg-avatar-5',
    tint: 'bg-avatar-5/15',
  },
} as const satisfies Record<
  string,
  { icon: MuiIconName; label: string; text: string; tone: string; tint: string }
>;

export type TypeKey = keyof typeof TYPES;
