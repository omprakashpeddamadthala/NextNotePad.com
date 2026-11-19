// Copies the Monaco editor files from node_modules into public/monaco/<version>/vs
// so the editor loads from this site (and can be cached for offline use) instead
// of a third-party CDN. Runs before `next dev` and `next build`; the output is
// git-ignored. Old versions are removed so public/ doesn't grow.
import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(
  readFileSync(path.join(root, "node_modules/monaco-editor/package.json"), "utf8"),
);
const source = path.join(root, "node_modules/monaco-editor/min/vs");
const outDir = path.join(root, "public/monaco");
const target = path.join(outDir, pkg.version, "vs");

if (existsSync(outDir)) {
  for (const entry of readdirSync(outDir)) {
    if (entry !== pkg.version) rmSync(path.join(outDir, entry), { recursive: true, force: true });
  }
}

if (existsSync(path.join(target, "loader.js"))) {
  console.log(`[copy-monaco] monaco-editor ${pkg.version} already in public/monaco`);
} else {
  cpSync(source, target, { recursive: true });
  console.log(`[copy-monaco] copied monaco-editor ${pkg.version} to public/monaco`);
}
