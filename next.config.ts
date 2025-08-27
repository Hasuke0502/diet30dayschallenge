import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Capacitor対応の設定
  assetPrefix: undefined,
  basePath: ''
};

export default nextConfig;
