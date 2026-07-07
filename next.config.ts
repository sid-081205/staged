import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "sharp"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
