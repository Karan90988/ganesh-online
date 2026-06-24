import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for Docker/EC2 (.next/standalone/server.js).
  // Ignored by Vercel, so it's safe to keep enabled everywhere.
  output: "standalone",
  // Pin the workspace root to this project (the mobile/ app has its own lockfile).
  outputFileTracingRoot: process.cwd(),
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // cache optimized images for 1 day
    // Allow images from any HTTPS source so admins can paste any image URL
    // (Cloudinary, Google Drive direct links, supplier sites, etc.).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // allow Excel uploads
    },
  },
};

export default nextConfig;
