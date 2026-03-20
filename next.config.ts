import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable Turbopack persistent cache — causes SST write crashes on macOS
    turbopackFileSystemCacheForDev: false,
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/findings",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
