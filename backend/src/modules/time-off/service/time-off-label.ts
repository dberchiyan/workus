import { isoDay } from '../../../common/time/iso-day';
/** History label, e.g. "Vacation, 2026-06-26 – 2026-06-30" (the history keeps it as written). */
export const timeOffLabel = (request: { type: string; startsAt: Date; endsAt: Date }): string => {
    const name = TYPE_NAMES[request.type] ?? request.type;
    const start = isoDay(request.startsAt);
    const end = isoDay(request.endsAt);
    return start === end ? `${name}, ${start}` : `${name}, ${start} – ${end}`;
};

const TYPE_NAMES: Readonly<Record<string, string>> = {
    VACATION: 'Vacation',
    SICK_DAY: 'Sick day',
    DAY_OFF: 'Day off',
};
