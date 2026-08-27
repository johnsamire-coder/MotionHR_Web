/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf2pic"],
  turbopack: {}, // empty turbopack config to silence the warning
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
