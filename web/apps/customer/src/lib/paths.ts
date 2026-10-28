const PUBLIC_PATHS = new Set(['/login', '/register', '/forgot-password']);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Browsing stays public; checkout and account pages require a session.
  if (pathname === '/' || pathname === '/home' || pathname === '/search') return true;
  if (pathname.startsWith('/restaurants/')) return true;
  if (pathname === '/cart') return true;
  return false;
}
