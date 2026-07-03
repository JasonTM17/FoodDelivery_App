export function resolveGoogleMapsApiKey(
  env: Record<string, string | undefined> = process.env,
): string {
  const configuredKey = env.NEXT_PUBLIC_GOOGLE_MAPS_KEY?.trim();
  if (configuredKey) return configuredKey;

  if (env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY is required for the admin driver map');
  }

  return '';
}
