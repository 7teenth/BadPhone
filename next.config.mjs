/** @type {import('next').NextConfig} */

const nextConfig = {
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  distDir: '.next',
  trailingSlash: true,
  basePath: process.env.STATIC_EXPORT === 'true' ? '' : undefined,
  assetPrefix: process.env.STATIC_EXPORT === 'true' ? '/' : undefined,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
};

export default nextConfig;