/** Allowlist https-only URLs for user-supplied attachment hrefs (B-WEB-12). */
export function isHttpsUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
