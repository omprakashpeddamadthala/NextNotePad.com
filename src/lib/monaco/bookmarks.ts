import type { Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";

/** In-memory only (not persisted across reloads) — bookmarks live for the session, per file. */
const bookmarkLines = new Map<string, Set<number>>();
const decorationIds = new Map<string, string[]>();

function applyDecorations(model: MonacoEditorNS.ITextModel, fileId: string, monaco: Monaco) {
  const lines = Array.from(bookmarkLines.get(fileId) ?? []);
  const newDecorations = lines.map((line) => ({
    range: new monaco.Range(line, 1, line, 1),
    options: {
      isWholeLine: false,
      glyphMarginClassName: "np-bookmark-glyph",
      glyphMarginHoverMessage: { value: "Bookmarked line" },
    },
  }));
  const oldIds = decorationIds.get(fileId) ?? [];
  const newIds = model.deltaDecorations(oldIds, newDecorations);
  decorationIds.set(fileId, newIds);
}

export function toggleBookmark(
  model: MonacoEditorNS.ITextModel,
  fileId: string,
  lineNumber: number,
  monaco: Monaco,
): void {
  const set = bookmarkLines.get(fileId) ?? new Set<number>();
  if (set.has(lineNumber)) set.delete(lineNumber);
  else set.add(lineNumber);
  bookmarkLines.set(fileId, set);
  applyDecorations(model, fileId, monaco);
}

export function nextBookmarkLine(fileId: string, afterLine: number): number | null {
  const lines = Array.from(bookmarkLines.get(fileId) ?? []).sort((a, b) => a - b);
  if (lines.length === 0) return null;
  return lines.find((l) => l > afterLine) ?? lines[0];
}
