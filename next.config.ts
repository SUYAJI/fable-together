import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint is enabled by default in Next.js
  // Most ESLint errors have been fixed - keeping ignoreDuringBuilds for script files that use require()
  eslint: {
    ignoreDuringBuilds: true, // Script files in src/scripts use require() which is intentional
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
