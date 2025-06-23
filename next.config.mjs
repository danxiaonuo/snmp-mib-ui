/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  // Optimized for pure binary deployment
  output: 'standalone',
=======
  // Optimized for development and production
  // output: 'standalone', // Disabled for now
>>>>>>> 15e95b75bc9966f74fe921db8b4c82b9ae529082
  
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