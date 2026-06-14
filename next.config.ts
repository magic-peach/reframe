import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  experimental: {
    scrollRestoration: true,
  },
  // Required for ffmpeg.wasm to load WASM files correctly
  // Without this, Next.js might try to process .wasm files and break them
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;