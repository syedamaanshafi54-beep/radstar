
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.create.vista.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = {
  async rewrites() {
    return [
      {
        source: "/policies",
        destination: "/policies.html",
      },
    ];
  },
};


export default nextConfig;
