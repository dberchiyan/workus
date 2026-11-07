import type { HolidayRecord } from '../../repository/record/holiday.record';
import type { HolidayResponse } from '../dto/holiday.response';

export const toHolidayResponse = (holiday: HolidayRecord): HolidayResponse => ({
  id: holiday.id,
  date: holiday.date.toISOString().slice(0, 10),
  name: holiday.name,
  recurring: holiday.recurring,
  carriedOver: holiday.carriedOver,
  version: holiday.version,
});
