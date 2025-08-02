/** @type {import('next').NextConfig} */
const nextConfig = {
  // Включаем статический экспорт только для production build
  ...(process.env.STATIC_EXPORT === "true" && { output: "export" }),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === "production" ? "/" : "",
  experimental: {
    esmExternals: false,
  },
}

export default nextConfig
