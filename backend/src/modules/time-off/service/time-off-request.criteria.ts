import type { TimeOffStatus, TimeOffType } from './time-off-type';

/** Pending requests wait for a decision; closed ones are everything else. */
export const RequestState = { PENDING: 'PENDING', CLOSED: 'CLOSED' } as const;
export type RequestState = (typeof RequestState)[keyof typeof RequestState];
export const REQUEST_STATES = Object.values(RequestState) as [RequestState, ...RequestState[]];

/** Filters of the admin request lists. */
export interface TimeOffRequestCriteria {
  state: RequestState;
  /** Closed list only: one of the closed statuses. */
  status: Exclude<TimeOffStatus, 'PENDING'> | undefined;
  type: TimeOffType | undefined;
  /** Only requests this user may decide. */
  responsibleUserId: string | undefined;
  /** Every term matches the employee's first or last name. */
  searchTerms: string[];
}
