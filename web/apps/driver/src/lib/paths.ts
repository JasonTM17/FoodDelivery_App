const PUBLIC_PATHS = new Set(['/login']);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}
