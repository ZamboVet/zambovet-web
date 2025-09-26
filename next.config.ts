import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router is default in Next.js 13+
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Configure API routes for file uploads
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Configure body parser for larger file uploads
  serverRuntimeConfig: {
    maxFileSize: '10mb',
  },
};

export default nextConfig;
