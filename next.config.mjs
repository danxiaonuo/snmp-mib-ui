/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration only
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // TypeScript and ESLint ignore errors for dev
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig