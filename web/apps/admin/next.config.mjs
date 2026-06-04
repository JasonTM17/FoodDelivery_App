/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vis.gl/react-google-maps'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
