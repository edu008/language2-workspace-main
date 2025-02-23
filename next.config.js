/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true', // Analyse nur, wenn ANALYZE=true gesetzt ist
});

const nextConfig = {
  reactStrictMode: true,

  // Bildoptimierung für spezifische Domains
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'cdn.discordapp.com',
    ],
  },

  // Aktiviert Komprimierung für kleinere Payloads
  compress: true,

  // Experimentelle Optimierungen (optional)
  experimental: {
    scrollRestoration: true, // Verbessert die User Experience beim Zurück- und Weitergehen
  },
};

// Exportiere die Konfiguration mit dem Bundle-Analyzer
module.exports = withBundleAnalyzer(nextConfig);
