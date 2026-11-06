import { createParamDecorator } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { NotAuthenticatedException } from '../exception/api.exception';
import type { RequestContext } from '../context/request-context';
import type { Principal } from './principal';

/** The principal of an `@Authorize`d handler. */
export const CurrentPrincipal = createParamDecorator((): Principal => {
  const principal = ClsServiceManager.getClsService<RequestContext>().get('principal');
  if (!principal) {
    throw new NotAuthenticatedException();
  }
  return principal;
});
