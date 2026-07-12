// eslint-disable-next-line @typescript-eslint/no-require-imports
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');
const shouldUseStandaloneOutput =
  process.env.NEXT_OUTPUT_STANDALONE === 'true' ||
  (process.env.NEXT_OUTPUT_STANDALONE !== 'false' && process.platform !== 'win32');
const shouldEnableDevApiRewrite =
  process.env.FOODFLOW_ENABLE_DEV_API_REWRITE === 'true' && process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(shouldUseStandaloneOutput ? { output: 'standalone' } : {}),
  transpilePackages: ['@foodflow/i18n', '@foodflow/ui'],
  ...(shouldEnableDevApiRewrite
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: 'http://localhost:3001/api/:path*',
            },
          ];
        },
      }
    : {}),
};

module.exports = withNextIntl(nextConfig);
