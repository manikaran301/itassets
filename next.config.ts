import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow dev server access from specific origins (configure via env if needed)
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',') || [],
  // External image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.simpleicons.org',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
