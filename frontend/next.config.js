/** @type {import('next').NextConfig} */
const RAILWAY_URL = "https://finmind-ai-production.up.railway.app";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${RAILWAY_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
