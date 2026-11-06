import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';

export const FALLBACK_LOCALE = 'en';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: FALLBACK_LOCALE,
      loaderOptions: { path: join(__dirname, '..', '..', 'i18n'), watch: false },
      resolvers: [AcceptLanguageResolver],
      logging: false,
    }),
  ],
})
export class AppI18nModule {}
