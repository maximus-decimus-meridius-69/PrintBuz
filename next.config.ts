import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_OUTPUT_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;