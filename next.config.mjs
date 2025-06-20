/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration for development
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // TypeScript and ESLint ignore errors for development
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig