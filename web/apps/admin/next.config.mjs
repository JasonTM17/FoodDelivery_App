import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');
const shouldUseStandaloneOutput =
  process.env.NEXT_OUTPUT_STANDALONE === 'true' ||
  (process.env.NEXT_OUTPUT_STANDALONE !== 'false' && process.platform !== 'win32');

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(shouldUseStandaloneOutput ? { output: 'standalone' } : {}),
  transpilePackages: ['@vis.gl/react-google-maps', '@foodflow/i18n', '@foodflow/ui'],
};

export default withNextIntl(nextConfig);
