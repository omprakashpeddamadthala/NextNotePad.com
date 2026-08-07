import type { NodeMap } from "@/lib/utils/treeUtils";
import { getActiveRepository } from "@/services/storage/activeRepository";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";

export interface SearchOptions {
  isRegex: boolean;
  wholeWord: boolean;
  caseSensitive: boolean;
}

interface SearchMatch {
  line: number;
  column: number;
  length: number;
  lineText: string;
}

export interface FileSearchResult {
  fileId: string;
  fileName: string;
  filePath: string;
  matches: SearchMatch[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchRegex(query: string, options: SearchOptions): RegExp | null {
  if (!query) return null;
  let pattern = options.isRegex ? query : escapeRegExp(query);
  if (options.wholeWord) pattern = `\\b(?:${pattern})\\b`;
  try {
    return new RegExp(pattern, options.caseSensitive ? "g" : "gi");
  } catch {
    return null;
  }
}

function findMatchesInText(content: string, regex: RegExp): SearchMatch[] {
  const lines = content.split(/\r\n|\r|\n/);
  const matches: SearchMatch[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(lineText))) {
      matches.push({ line: i + 1, column: m.index + 1, length: m[0].length, lineText });
      if (m[0].length === 0) regex.lastIndex += 1;
    }
  }
  return matches;
}

export async function searchWorkspace(
  nodes: NodeMap,
  query: string,
  options: SearchOptions,
  fileIds?: string[],
): Promise<FileSearchResult[]> {
  const regex = buildSearchRegex(query, options);
  if (!regex) return [];

  const targetFiles = Object.values(nodes).filter(
    (n) => n.type === "file" && !n.deleted && (!fileIds || fileIds.includes(n.id)),
  );

  const results: FileSearchResult[] = [];
  for (const file of targetFiles) {
    const openModel = modelRegistry.getModel(file.id);
    const content = openModel ? openModel.getValue() : await getActiveRepository().readFileContent(file.id);
    const matches = findMatchesInText(content, regex);
    if (matches.length > 0) {
      results.push({ fileId: file.id, fileName: file.name, filePath: file.path, matches });
    }
  }
  return results;
}

export interface ReplaceSummary {
  filesChanged: number;
  replacements: number;
}

export async function replaceInFiles(
  nodes: NodeMap,
  query: string,
  replacement: string,
  options: SearchOptions,
  fileIds?: string[],
): Promise<ReplaceSummary> {
  const regex = buildSearchRegex(query, options);
  if (!regex) return { filesChanged: 0, replacements: 0 };

  const targetFiles = Object.values(nodes).filter(
    (n) => n.type === "file" && !n.deleted && (!fileIds || fileIds.includes(n.id)),
  );

  let filesChanged = 0;
  let replacements = 0;

  for (const file of targetFiles) {
    const openModel = modelRegistry.getModel(file.id);
    const content = openModel ? openModel.getValue() : await getActiveRepository().readFileContent(file.id);
    const matches = findMatchesInText(content, regex);
    if (matches.length === 0) continue;

    replacements += matches.length;
    filesChanged += 1;
    regex.lastIndex = 0;
    const newContent = content.replace(regex, () => replacement);

    if (openModel) {
      openModel.setValue(newContent);
      modelRegistry.markSaved(file.id, newContent);
      const tab = useTabsStore.getState().tabForFile(file.id);
      if (tab) useTabsStore.getState().setDirty(tab.id, false);
    }
    await getActiveRepository().writeFileContent(file.id, newContent);
    useWorkspaceStore.getState().updateNode(file.id, { size: newContent.length });
  }

  return { filesChanged, replacements };
}
