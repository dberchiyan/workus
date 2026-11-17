import type { Operations, Schemas } from '@/shared/types';

export type CurrentUser = Schemas['CurrentUserResponse_Output'];
export type LoginRequest = Schemas['LoginRequest'];
export type ChangePasswordRequest = Schemas['ChangePasswordRequest'];
export type UpdateOwnNameRequest = Schemas['UpdateOwnNameRequest'];
export type UserSession = Schemas['Session_Output'];
export type UserSessions = Schemas['SessionsResponse_Output'];
export type SecurityEvent = Schemas['SecurityEvent_Output'];
export type SecurityLog = Schemas['SecurityLogResponse_Output'];
export type SecurityCategory = NonNullable<
    NonNullable<Operations['AuthController_securityLog']['parameters']['query']>['category']
>;
