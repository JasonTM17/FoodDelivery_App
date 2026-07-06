import { assertProductionPublicValue, isProductionDeployment } from './public-env';

export function resolveGoogleMapsApiKey(
  env: Record<string, string | undefined> = process.env,
): string {
  const configuredKey = env.NEXT_PUBLIC_GOOGLE_MAPS_KEY?.trim();
  if (configuredKey) {
    return assertProductionPublicValue(
      'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
      configuredKey,
      env,
      ['your-google-maps-browser-key'],
    );
  }

  if (isProductionDeployment(env)) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY is required for the restaurant order tracking map');
  }

  return '';
}
