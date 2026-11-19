import type { NextConfig } from "next";
import { readFileSync } from "node:fs";

// The editor is served from public/monaco/<version>/vs (see scripts/copy-monaco.mjs).
const monacoVersion = (
  JSON.parse(
    readFileSync("node_modules/monaco-editor/package.json", "utf8"),
  ) as { version: string }
).version;

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  env: {
    NEXT_PUBLIC_MONACO_VERSION: monacoVersion,
  },
};

export default nextConfig;
