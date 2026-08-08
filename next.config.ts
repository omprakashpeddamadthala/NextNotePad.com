import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The codebase is already written compiler-safe (see eslint's react-hooks/* rules) — this
  // turns that into real auto-memoization instead of just linting for future-compatibility.
  experimental: {
    reactCompiler: true,
  },
  // Without this, webpack bundles the adapter's native-binding glue code instead of leaving it
  // as a real require() — better-sqlite3 itself is externalized by Next by default, but this
  // wrapper isn't, and bundling it corrupts the driver errors Prisma relies on to normalize
  // failures (surfaces as "Cannot read properties of undefined (reading 'indexOf')").
  serverExternalPackages: ["@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
