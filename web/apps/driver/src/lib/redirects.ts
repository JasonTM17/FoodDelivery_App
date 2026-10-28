/**
 * Sanitizes a `?next=` redirect target so open redirects to external origins
 * or protocol-relative URLs are impossible.
 */
export function sanitizeNextPath(value: string | null | undefined, fallback = '/home'): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('://') || trimmed.includes('\\')) return fallback;
  return trimmed;
}
