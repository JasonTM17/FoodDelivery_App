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
    '/orders',
    '/orders/:path*',
    '/menu',
    '/menu/:path*',
    '/revenue',
    '/promotions',
    '/promotions/:path*',
    '/analytics',
    '/insights',
    '/staff',
    '/reviews',
    '/notifications',
    '/settings',
    '/settings/:path*',
  ],
};
