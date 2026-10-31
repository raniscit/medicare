/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const rawBackend = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!rawBackend) {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:8000/api/:path*",
        },
      ];
    }
    // Strip trailing slashes and redundant /api if already entered
    const base = rawBackend.replace(/\/+$/, "").replace(/\/api$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${base}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
