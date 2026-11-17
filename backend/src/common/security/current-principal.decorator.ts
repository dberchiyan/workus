import { createParamDecorator } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';

import type { RequestContext } from '../context/request-context';
import { NotAuthenticatedException } from '../exception/api.exception';
import type { Principal } from './principal';

export const CurrentPrincipal = createParamDecorator((): Principal => {
    const principal = ClsServiceManager.getClsService<RequestContext>().get('principal');
    if (!principal) {
        throw new NotAuthenticatedException();
    }
    return principal;
});
