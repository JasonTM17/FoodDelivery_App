import { locales } from '@foodflow/i18n';

const PUBLIC_AUTH_PATHS = ['/login', '/forgot-password', '/reset-password'] as const;

export function isAdminPublicPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || locales.some((locale) => pathname === `/${locale}${path}`),
  );
}
