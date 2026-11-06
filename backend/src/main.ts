import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { ClsMiddleware } from 'nestjs-cls';
import { Logger, PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config.service';
import { CLS_MIDDLEWARE_OPTIONS } from './common/context/context.module';
import { TRACE_ID_HEADER } from './common/context/trace-id';
import { buildOpenApiDocument } from './openapi';

const BODY_LIMIT = '1mb';
const DOCS_PATH = 'docs';
const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.useLogger(app.get(Logger));
  const logger = await app.resolve(PinoLogger);
  logger.setContext('Bootstrap');
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled rejection');
    process.exit(1);
  });
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception');
    process.exit(1);
  });

  const config = app.get(AppConfigService);
  const trustProxyHops = config.get('TRUST_PROXY_HOPS');
  app.set('trust proxy', trustProxyHops > 0 ? trustProxyHops : false);
  app.disable('x-powered-by');
  app.use(new ClsMiddleware(CLS_MIDDLEWARE_OPTIONS).use);
  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.use(cookieParser());

  const strictHelmet = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true },
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
  });
  const docsHelmet = helmet({ contentSecurityPolicy: false });
  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
    const isDocs = config.isDev && request.path.startsWith(`/${DOCS_PATH}`);
    (isDocs ? docsHelmet : strictHelmet)(request, response, next);
  });

  app.enableCors({
    origin: config.get('CORS_ALLOWED_ORIGINS'),
    credentials: true,
    exposedHeaders: ['Deprecation', 'Sunset', 'Retry-After', TRACE_ID_HEADER],
  });
  app.enableShutdownHooks();

  if (config.isDev) {
    SwaggerModule.setup(
      DOCS_PATH,
      app,
      buildOpenApiDocument(app, config.get('SESSION_COOKIE_NAME')),
    );
  }

  await app.listen(config.get('PORT'));
  logger.info({ port: config.get('PORT'), env: config.get('APP_ENV') }, 'Application started');
};

void bootstrap();
