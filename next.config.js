/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const crypto = require('crypto');

const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  compress: true,
  productionBrowserSourceMaps: true,
  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ['@fortawesome/fontawesome-svg-core', 'framer-motion', 'recharts'],
  },
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
  async headers() {
    // Only apply CSP in production mode
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/fonts/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        // Add Content Security Policy header for all pages
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              // Allow unsafe-eval for third-party libraries that need it
              value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://cdn.discordapp.com; media-src 'self' data: blob:; object-src 'self' data: blob:; connect-src 'self' ws: wss:; worker-src 'self' blob:;"
            }
          ],
        },
      ];
    } else {
      // In development mode, only apply cache headers but no CSP
      return [
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/fonts/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ];
    }
  },
};

module.exports = withBundleAnalyzer(nextConfig);
