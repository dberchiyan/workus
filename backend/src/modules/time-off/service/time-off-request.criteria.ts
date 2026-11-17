import type { TimeOffStatus, TimeOffType } from './time-off-type';

export const RequestState = { PENDING: 'PENDING', CLOSED: 'CLOSED' } as const;
export type RequestState = (typeof RequestState)[keyof typeof RequestState];
export const REQUEST_STATES = Object.values(RequestState) as [RequestState, ...RequestState[]];

export interface TimeOffRequestCriteria {
    state: RequestState;
    status: Exclude<TimeOffStatus, 'PENDING'> | undefined;
    type: TimeOffType | undefined;
    responsibleUserId: string | undefined;
    searchTerms: string[];
}
