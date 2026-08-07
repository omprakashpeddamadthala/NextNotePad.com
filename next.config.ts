import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The codebase is already written compiler-safe (see eslint's react-hooks/* rules) — this
  // turns that into real auto-memoization instead of just linting for future-compatibility.
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
