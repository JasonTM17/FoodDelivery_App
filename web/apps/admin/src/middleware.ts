import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['vi', 'en', 'ja'],
  defaultLocale: 'vi',
  localePrefix: 'always',
});

export const config = {
  matcher: [
    '/',
    '/(vi|en|ja)/:path*',
    '/login',
    '/overview',
    '/orders',
    '/orders/:path*',
    '/restaurants',
    '/restaurants/:path*',
    '/users',
    '/drivers',
    '/drivers/:path*',
    '/promotions',
    '/logs',
    '/settings',
    '/support',
    '/ai-monitor',
    '/analytics',
  ],
};
