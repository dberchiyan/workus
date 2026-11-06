import { Module } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ClsModule, type ClsMiddlewareOptions } from 'nestjs-cls';
import { PersistenceModule } from '../persistence/persistence.module';
import { PrismaService } from '../persistence/prisma.service';
import { generateTraceId, TRACE_ID_HEADER } from './trace-id';

/**
 * Mounted in main.ts before the body parser, so errors raised while parsing the body carry a
 * trace id too.
 */
export const CLS_MIDDLEWARE_OPTIONS: Omit<ClsMiddlewareOptions, 'mount'> = {
  generateId: true,
  idGenerator: generateTraceId,
  useEnterWith: true,
  setup: (cls, _req, res: { setHeader: (name: string, value: string) => void }) => {
    res.setHeader(TRACE_ID_HEADER, cls.getId());
  },
};

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: false },
      plugins: [
        new ClsPluginTransactional({
          imports: [PersistenceModule],
          adapter: new TransactionalAdapterPrisma({ prismaInjectionToken: PrismaService }),
        }),
      ],
    }),
  ],
})
export class ContextModule {}
