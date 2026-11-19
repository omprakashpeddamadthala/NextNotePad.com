import type { TreeFormat, TreeParseResult } from "./treeModel";

/** Files above this size show a warning instead of a tree. */
export const MAX_TREE_CHARS = 10_000_000;

const BY_LANGUAGE: Record<string, TreeFormat> = { json: "json", yaml: "yaml", xml: "xml" };
const BY_EXTENSION: Record<string, TreeFormat> = {
  json: "json",
  jsonc: "json",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  svg: "xml",
  xsd: "xml",
  xsl: "xml",
  plist: "xml",
  csproj: "xml",
};

/** Which tree format a note uses, or null when the tree view doesn't apply. */
export function treeFormatFor(language: string, fileName: string): TreeFormat | null {
  if (BY_LANGUAGE[language]) return BY_LANGUAGE[language];
  const ext = /\.([A-Za-z0-9]+)$/.exec(fileName)?.[1]?.toLowerCase();
  return ext ? (BY_EXTENSION[ext] ?? null) : null;
}

/** Parsers are loaded on first use so they never slow down opening the app. */
export async function parseNoteTree(text: string, format: TreeFormat): Promise<TreeParseResult> {
  if (format === "json") return (await import("./parseJson")).parseJsonTree(text);
  if (format === "yaml") return (await import("./parseYaml")).parseYamlTree(text);
  return (await import("./parseXml")).parseXmlTree(text);
}
