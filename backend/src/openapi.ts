import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { SESSION_COOKIE_SECURITY } from './common/security/security.decorators';

/** Builds the OpenAPI document; Zod DTOs are the schemas. */
export const buildOpenApiDocument = (
  app: INestApplication,
  sessionCookieName: string,
): OpenAPIObject => {
  const config = new DocumentBuilder()
    .setTitle('Workus API')
    .setVersion('1')
    .addCookieAuth(sessionCookieName, { type: 'apiKey', in: 'cookie' }, SESSION_COOKIE_SECURITY)
    .build();
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
};
