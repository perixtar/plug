// next.config.ts
import type { NextConfig } from "next";

const config = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" }, // Unsplash sometimes uses this
      { protocol: "https", hostname: "images.pexels.com" }, // if you also use Pexels
    ],
    // (optional) formats: ['image/avif', 'image/webp'],
  },
} satisfies NextConfig;

export default config;
