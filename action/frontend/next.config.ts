import type { NextConfig } from "next";

// Compute basePath from environment (set in CI for GitHub Pages)
// When BASE_PATH is empty, we omit basePath/assetPrefix so that root is used
const envBasePath = process.env.BASE_PATH || "";
const computedBasePath = envBasePath && envBasePath !== "/" ? envBasePath : undefined;

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },

  // Public path configuration derived from CI
  basePath: computedBasePath,
  assetPrefix: computedBasePath ? `${computedBasePath}/` : undefined,

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;


