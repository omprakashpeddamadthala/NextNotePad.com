import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
};

export default nextConfig;
