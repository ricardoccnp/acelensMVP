import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization — allow external player/flag images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Allow server-side env vars to be referenced
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
