/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = {
  ...nextConfig,
  images: {
      domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com',  'cdn.discordapp.com']
  },
};



