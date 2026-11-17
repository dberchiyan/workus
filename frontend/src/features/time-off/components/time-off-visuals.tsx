import BeachAccessOutlined from '@mui/icons-material/BeachAccessOutlined';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import LocalHospitalOutlined from '@mui/icons-material/LocalHospitalOutlined';

import type { TimeOffType } from '../types';

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

export const NOT_EMPLOYED_PATTERN =
    'bg-[repeating-linear-gradient(135deg,var(--color-divider)_0_1px,transparent_1px_6px)]';
