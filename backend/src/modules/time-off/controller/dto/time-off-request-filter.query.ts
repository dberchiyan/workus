import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TimeOffRequestFilterQuerySchema = z.object({
  /**
   * Only requests still pending or changed (created, decided, canceled) at or after this
   * instant — e.g. the start of today (UTC) for the dashboard. Absent → all requests.
   */
  changedSince: z.iso.datetime({ offset: true, error: 'validation.invalid' }).optional(),
});

export class TimeOffRequestFilterQuery extends createZodDto(TimeOffRequestFilterQuerySchema) {}
