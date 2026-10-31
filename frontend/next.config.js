/** @type {import('next').NextConfig} */
const rawBackend =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const backendOrigin = rawBackend.trim().replace(/\/+$/, "").replace(/\/api$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
