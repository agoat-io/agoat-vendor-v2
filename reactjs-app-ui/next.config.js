const { NextFederationPlugin } = require('@module-federation/nextjs-mf')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, options) {
    const { isServer } = options
    
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        remotes: {
          // Runtime resolution - no build-time knowledge needed
          viewer: `viewer@${process.env.NEXT_PUBLIC_VIEWER_URL || 'http://localhost:3001'}/remoteEntry.js`,
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          'react-dom': { singleton: true, requiredVersion: false },
          axios: { singleton: true },
          marked: { singleton: true }
        },
        extraOptions: {
          exposePages: true,
          enableImageLoaderFix: true,
          enableUrlLoaderFix: true
        }
      })
    )

    return config
  },
  
  // Enable experimental features for module federation
  experimental: {
    esmExternals: false
  },
  
  // Configure for different environments
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    NEXT_PUBLIC_VIEWER_URL: process.env.NEXT_PUBLIC_VIEWER_URL || 'http://localhost:3001'
  },

  // Disable strict mode for federation compatibility
  reactStrictMode: false,
  
  // Configure rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  }
}

module.exports = nextConfig
