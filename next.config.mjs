/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'https://jssolutions-eg.com/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'jssolutions-eg.com' },
      { protocol: 'https', hostname: 'motion.jssolutions-eg.com' },
    ],
  },
};

export default nextConfig;
