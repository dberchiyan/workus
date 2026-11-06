import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config.service';
import { buildOpenApiDocument } from './openapi';

/** Writes openapi.json (or the path given as the first argument). */
const generate = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { logger: false, bodyParser: false });
  const config = app.get(AppConfigService);
  const document = buildOpenApiDocument(app, config.get('SESSION_COOKIE_NAME'));
  const target = process.argv[2] ?? join(process.cwd(), 'openapi.json');
  await writeFile(target, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
};

void generate();
