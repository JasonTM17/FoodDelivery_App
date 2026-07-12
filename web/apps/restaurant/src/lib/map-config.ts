import {
  assertProductionPublicUrl,
  assertProductionPublicValue,
  isProductionDeployment,
} from './public-env';

export const DEFAULT_OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export interface PublicMapConfig {
  provider: 'openfreemap';
  styleUrl: string;
}

export function resolvePublicMapConfig(
  env: Record<string, string | undefined> = process.env,
): PublicMapConfig {
  const production = isProductionDeployment(env);
  const provider = env.NEXT_PUBLIC_MAP_PROVIDER?.trim().toLowerCase() || (production ? '' : 'openfreemap');

  if (!provider) {
    throw new Error('NEXT_PUBLIC_MAP_PROVIDER is required for the restaurant order tracking map');
  }
  if (provider !== 'openfreemap') {
    throw new Error(`NEXT_PUBLIC_MAP_PROVIDER must be openfreemap, received ${provider}`);
  }

  const configuredStyleUrl = env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (!configuredStyleUrl && production) {
    throw new Error('NEXT_PUBLIC_MAP_STYLE_URL is required for the restaurant order tracking map');
  }

  const styleUrl = configuredStyleUrl || DEFAULT_OPENFREEMAP_STYLE_URL;
  const nonPlaceholderStyleUrl = assertProductionPublicValue(
    'NEXT_PUBLIC_MAP_STYLE_URL',
    styleUrl,
    env,
    [],
  );

  const validatedStyleUrl = assertProductionPublicUrl(
    'NEXT_PUBLIC_MAP_STYLE_URL',
    nonPlaceholderStyleUrl,
    env,
  );
  if (production) assertOfficialOpenFreeMapStyle(validatedStyleUrl);

  return {
    provider: 'openfreemap',
    styleUrl: validatedStyleUrl,
  };
}

function assertOfficialOpenFreeMapStyle(styleUrl: string): void {
  const parsed = new URL(styleUrl);
  if (
    parsed.hostname !== 'tiles.openfreemap.org' ||
    !parsed.pathname.startsWith('/styles/') ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'NEXT_PUBLIC_MAP_STYLE_URL must be a credential-free OpenFreeMap style URL in production',
    );
  }
}
