import createMiddleware from 'next-intl/middleware';

/**
 * Locale-routing middleware for the restaurant app.
 * Matcher covers: root, /login, and any explicitly locale-prefixed path.
 * Non-migrated routes are excluded so they work without redirection.
 */
export default createMiddleware({
  locales: ['vi', 'en', 'ja'],
  defaultLocale: 'vi',
  localePrefix: 'always',
});

export const config = {
  matcher: [
    '/',
    '/login',
    '/(vi|en|ja)/:path*',
  ],
};
