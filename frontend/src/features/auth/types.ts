import type { Schemas } from '@/shared/types';

export type CurrentUser = Schemas['CurrentUserResponse_Output'];
export type LoginRequest = Schemas['LoginRequest'];
export type ChangePasswordRequest = Schemas['ChangePasswordRequest'];
export type UserSession = Schemas['Session_Output'];
/** This session and a page of the other live ones. */
export type UserSessions = Schemas['SessionsResponse_Output'];
export type SecurityEvent = Schemas['SecurityEvent_Output'];
export type SecurityLog = Schemas['SecurityLogResponse_Output'];
