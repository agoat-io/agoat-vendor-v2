/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for different environments
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    NEXT_PUBLIC_VIEWER_URL: process.env.NEXT_PUBLIC_VIEWER_URL || 'http://localhost:3001'
  },
  
  // Configure rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },

  webpack: (config, { isServer }) => {
    // Ensure proper module resolution for federated modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Add Module Federation support for client-side only
    if (!isServer) {
      const { ModuleFederationPlugin } = require('webpack').container;
      
      config.plugins.push(
        new ModuleFederationPlugin({
          name: 'host',
          remotes: {
            viewer: 'viewer@http://localhost:3001/remoteEntry.js',
          },
          shared: {
            react: {
              singleton: true,
              requiredVersion: '^18.3.1',
              eager: false,
            },
            'react-dom': {
              singleton: true,
              requiredVersion: '^18.3.1',
              eager: false,
            },
          },
        })
      );
    }

    return config
  }
}

module.exports = nextConfig