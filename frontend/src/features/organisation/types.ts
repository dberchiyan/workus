import type { Operations, Schemas } from '@/shared/types';

export type RegistrationRequest = Schemas['RegistrationRequest'];
export type Organisation = Schemas['OrganisationResponse_Output'];
export type UpdateOrganisationRequest = Schemas['UpdateOrganisationRequest'];
export type Administrator = Schemas['Administrator_Output'];
export type AdministratorRole = Schemas['AdministratorRole_Output'];
export type AdministratorPage = Schemas['AdministratorPageResponse_Output'];
export type ChangeRoleRequest = Schemas['ChangeRoleRequest'];
export type AddAdministratorRequest = Schemas['AddAdministratorRequest'];
export type AddedAdministrator = Schemas['AddedAdministratorResponse_Output'];
export type AdministratorQuery = NonNullable<
  Operations['OrganisationController_administrators']['parameters']['query']
>;
