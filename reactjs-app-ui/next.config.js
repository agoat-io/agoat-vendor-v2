const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

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
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Provide React and ReactDOM to share scope and configure runtime remotes
    if (!isServer) {
      config.plugins.push(
        new NextFederationPlugin({
          name: 'host',
          filename: 'static/chunks/remoteEntry.js',
          remotes: {
            viewer: 'viewer@http://localhost:3001/remoteEntry.js',
          },
          shared: {
            react: { 
              singleton: true, 
              requiredVersion: '18.3.1',
              eager: true,
              strictVersion: false,
              shareScope: 'default'
            },
            'react-dom': { 
              singleton: true, 
              requiredVersion: '18.3.1',
              eager: true,
              strictVersion: false,
              shareScope: 'default'
            },
            'react/jsx-runtime': {
              singleton: true,
              requiredVersion: '18.3.1',
              eager: true,
              strictVersion: false,
              shareScope: 'default'
            },
            axios: { singleton: true, requiredVersion: '^1.11.0', eager: true, strictVersion: true },
            marked: { singleton: true, requiredVersion: '^16.2.0', eager: true, strictVersion: true },
          },
          shareScope: 'default'
        })
      )
    }

    return config
  }
}

module.exports = nextConfig