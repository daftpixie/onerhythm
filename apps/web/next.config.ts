import type { NextConfig } from "next";

import { buildWebResponseHeaderRules } from "./lib/response-security";

const nextConfig: NextConfig = {
  async headers() {
    return buildWebResponseHeaderRules(process.env.ONERHYTHM_ENV ?? process.env.NODE_ENV ?? "development");
  },
  experimental: {
    webpackBuildWorker: false,
  },
  reactStrictMode: true,
  transpilePackages: ["@onerhythm/ui"],
};

export default nextConfig;
