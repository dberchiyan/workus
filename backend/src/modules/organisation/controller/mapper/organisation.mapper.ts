import type { Administrator } from '../../../user/service/user.types';
import type { OrganisationRecord } from '../../repository/record/organisation.record';
import type { AdministratorResponse } from '../dto/administrator.response';
import type { OrganisationResponse } from '../dto/organisation.response';

export const toOrganisationResponse = (organisation: OrganisationRecord): OrganisationResponse => ({
  id: organisation.id,
  name: organisation.name,
  version: organisation.version,
});

/** Lists hold owners and admins only; the role is narrowed for the wire. */
export const toAdministratorResponse = (user: Administrator): AdministratorResponse => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role === 'OWNER' ? 'OWNER' : 'ADMIN',
  version: user.version,
});
