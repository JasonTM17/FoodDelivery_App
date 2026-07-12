import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');
const shouldUseStandaloneOutput =
  process.env.NEXT_OUTPUT_STANDALONE === 'true' ||
  (process.env.NEXT_OUTPUT_STANDALONE !== 'false' && process.platform !== 'win32');

// B-WEB-01 residual: access/refresh tokens stay in localStorage (not HttpOnly cookies).
// Full BFF cookie session is deferred; harden via CSP + thorough logout clearing instead.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: wss: ws: http://localhost:3001 ws://localhost:3001",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(shouldUseStandaloneOutput ? { output: 'standalone' } : {}),
  transpilePackages: ['@vis.gl/react-google-maps', '@foodflow/i18n', '@foodflow/ui'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
