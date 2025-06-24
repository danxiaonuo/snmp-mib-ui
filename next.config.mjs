/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  // Optimized for standalone deployment
  output: 'standalone',
=======
  // Optimized for development and production
  // output: 'standalone', // Disabled for now
>>>>>>> 3c5be285e4b0f6dacc4c1a93e0b46d7333c86be6
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Disable features not needed for binary deployment
  trailingSlash: false,
  reactStrictMode: true,
  
  // Temporary build settings
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Build optimizations
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
    ],
    turbo: {
      rules: {
        '*.svg': ['@svgr/webpack'],
      },
    },
  },
  
  // Enable static optimization where possible
  generateBuildId: async () => {
    return process.env.BUILD_ID || 'standalone-build'
  },
  
  // Minimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Webpack optimizations for smaller bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    }
    
    return config
  },
}

export default nextConfig