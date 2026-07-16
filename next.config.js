/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.vinted.net" },
      { protocol: "https", hostname: "**.vinted.it" },
    ],
  },
};
module.exports = nextConfig;
