import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow dev server access from network IPs (for HMR WebSocket)
  allowedDevOrigins: [
    "172.16.4.249",
    "localhost",
    "127.0.0.1",
  ],
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
