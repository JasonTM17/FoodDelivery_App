import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';

export default createMiddleware(routing);

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
