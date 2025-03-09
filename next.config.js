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
  // Note: We removed the unstable_runtimeJS option as it's not supported in this Next.js version
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      config.optimization.minimize = true;
      // Set the devtool option for source maps in production
      config.devtool = 'source-map';
      
      // Enable aggressive code splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            // Don't let webpack eliminate this chunk (prevents this chunk from
            // becoming a part of the commons chunk)
            enforce: true,
          },
          lib: {
            test(module) {
              return (
                module.size() > 80000 &&
                /node_modules[/\\]/.test(module.identifier())
              );
            },
            name(module) {
              const rawRequest = module.rawRequest;
              const packageName = rawRequest
                ? rawRequest.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1]
                : null;
              return packageName ? `npm.${packageName.replace('@', '')}` : null;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return (
                crypto
                  .createHash('sha1')
                  .update(
                    chunks.reduce((acc, chunk) => {
                      return acc + chunk.name;
                    }, '')
                  )
                  .digest('hex') + (isServer ? '-server' : '')
              );
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };

      // Configure Terser for better minification
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              ecma: 6,
              passes: 2,
            },
            mangle: true,
            module: true,
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ];
    }
    return config;
  },
  async headers() {
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
  },
};

module.exports = withBundleAnalyzer(nextConfig);
