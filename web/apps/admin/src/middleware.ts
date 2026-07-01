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
    '/users/:path*',
    '/drivers',
    '/drivers/:path*',
    '/promotions',
    '/promotions/:path*',
    '/logs',
    '/settings',
    '/support',
    '/support/:path*',
    '/ai-monitor',
    '/ai-monitor/:path*',
    '/analytics',
    '/reports',
    '/export-jobs',
  ],
};
