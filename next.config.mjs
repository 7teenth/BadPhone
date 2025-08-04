/** @type {import('next').NextConfig} */

const isStatic = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  output: isStatic ? 'export' : undefined,
  distDir: isStatic ? 'out' : '.next',
  trailingSlash: true,
  assetPrefix: isStatic ? '/' : undefined, // относительные пути для Electron
  basePath: isStatic ? '' : undefined,      // не нужен basePath, если не меняешь поддиректорию

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
