import type { Params } from 'nestjs-pino';
import { ClsServiceManager } from 'nestjs-cls';

/** Nest bootstrap chatter that is logged at `log` level; dropped so only our code logs at info. */
const SILENCED_CONTEXTS: ReadonlySet<string> = new Set([
  'NestFactory',
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'NestApplication',
  'ClsModule',
]);

const currentTraceId = (): string | undefined => {
  const cls = ClsServiceManager.getClsService();
  return cls.isActive() ? cls.getId() : undefined;
};

export const createLoggerOptions = (isDev: boolean): Params => ({
  pinoHttp: {
    level: isDev ? 'debug' : 'info',
    autoLogging: false,
    quietReqLogger: true,
    transport: {
      target: 'pino-pretty',
      options: { singleLine: true, translateTime: 'SYS:standard' },
    },
    mixin: () => {
      const traceId = currentTraceId();
      return traceId ? { traceId } : {};
    },
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'res.headers["set-cookie"]',
        '*.password',
        '*.passwordHash',
        '*.temporaryPassword',
        '*.token',
        '*.secret',
        '*.cookie',
      ],
      censor: '[redacted]',
    },
    hooks: {
      logMethod(args, method, level) {
        const [first] = args;
        const isSilenced =
          level <= 30 &&
          typeof first === 'object' &&
          first !== null &&
          'context' in first &&
          typeof first.context === 'string' &&
          SILENCED_CONTEXTS.has(first.context);
        if (!isSilenced) {
          method.apply(this, args);
        }
      },
    },
  },
});
