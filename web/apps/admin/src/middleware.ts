import createMiddleware from 'next-intl/middleware';

/**
 * Locale-routing middleware for the admin app.
 * Matcher covers: root, /login, and any explicitly locale-prefixed path.
 * Non-migrated routes (e.g. /orders, /overview) are excluded from the
 * matcher so they continue to be served without redirection.
 */
export default createMiddleware({
  locales: ['vi', 'en', 'ja'],
  defaultLocale: 'vi',
  localePrefix: 'always',
});

export const config = {
  matcher: [
    // Root — redirect to default locale
    '/',
    // Login — first route migrated to [locale]
    '/login',
    // Any path already carrying a locale prefix
    '/(vi|en|ja)/:path*',
  ],
};
