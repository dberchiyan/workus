import type { Schemas } from '@/shared/types';

export type AdminDashboard = Schemas['AdminDashboardResponse_Output'];
export type DashboardRequests = Schemas['DashboardRequestsResponse_Output'];
export type DashboardRequest = Schemas['DashboardRequest_Output'];
export type DashboardReview = Schemas['DashboardReview_Output'];
export type DashboardReviews = Schemas['DashboardReviewsResponse_Output'];
export type DashboardBirthday = Schemas['DashboardBirthday_Output'];
export type DashboardBirthdays = Schemas['DashboardBirthdaysResponse_Output'];

export interface LocalDay {
    date: string;
    from: string;
    to: string;
}

export interface DateRange {
    from: string;
    to: string;
}

export const EVENTS_PAGE_SIZE = 5;
