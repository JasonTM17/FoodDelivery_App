import { Module } from '@nestjs/common'
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  CookieResolver,
} from 'nestjs-i18n'
import * as path from 'path'

/**
 * Registers nestjs-i18n globally with three resolvers in priority order:
 *   1. ?lang= query param   (QueryResolver)
 *   2. Accept-Language header (AcceptLanguageResolver)
 *   3. lang cookie           (CookieResolver)
 * Falls back to 'vi' when no resolver matches.
 *
 * Locale JSON files live at src/i18n/locales/{lang}/{namespace}.json
 * Translation key format: '{namespace}.{key}'  e.g. 'errors.promotion_not_found'
 */
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        // __dirname at runtime = dist/i18n → locales at dist/i18n/locales/
        path: path.join(__dirname, 'locales'),
        watch: process.env.NODE_ENV === 'development',
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new CookieResolver(['lang']),
      ],
    }),
  ],
})
export class I18nSetupModule {}
