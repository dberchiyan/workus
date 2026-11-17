import { isoDay } from '../../../../common/time/iso-day';
import type { HolidayRecord } from '../../repository/record/holiday.record';
import type { HolidayResponse } from '../dto/holiday.response';

export const toHolidayResponse = (holiday: HolidayRecord): HolidayResponse => ({
    id: holiday.id,
    heldAt: isoDay(holiday.heldAt),
    name: holiday.name,
    isRecurring: holiday.isRecurring,
    isCarriedOver: holiday.isCarriedOver,
    version: holiday.version,
});
