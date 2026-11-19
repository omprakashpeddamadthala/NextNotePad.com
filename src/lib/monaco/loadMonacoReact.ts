/**
 * Loads @monaco-editor/react and points it at the Monaco files this site
 * serves itself (copied by scripts/copy-monaco.mjs), instead of the default
 * jsDelivr CDN, so the editor works offline once cached.
 */
export async function loadMonacoReact() {
  const mod = await import("@monaco-editor/react");
  mod.loader.config({
    paths: { vs: `/monaco/${process.env.NEXT_PUBLIC_MONACO_VERSION}/vs` },
  });
  return mod;
}
