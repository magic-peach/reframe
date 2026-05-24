import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Required for ffmpeg.wasm to load WASM files correctly
  // Without this, Next.js might try to process .wasm files and break them
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  // Headers for FFmpeg WASM SharedArrayBuffer support
  // Note: With output: 'export', these headers are not applied by Next.js
  // Use serve.json instead for static hosting
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
