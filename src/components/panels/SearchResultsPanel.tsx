"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Replace,
  CaseSensitive,
  WholeWord,
  Regex as RegexIcon,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import {
  searchWorkspace,
  replaceInFiles,
  type FileSearchResult,
  type SearchOptions,
} from "@/services/search/searchService";
import { openFileAtLocation } from "@/services/fileOperations";
import { useDebouncedCallback } from "@/hooks/useDebounce";

type ResultRow =
  | { kind: "file"; fileResult: FileSearchResult }
  | { kind: "match"; fileId: string; match: FileSearchResult["matches"][number]; index: number };

// Must stay in sync with the row markup below (file header row vs. match row) — the virtualizer
// positions rows absolutely at this pitch, so a mismatch clips or overlaps them.
const ROW_HEIGHT_FILE = 28;
const ROW_HEIGHT_MATCH = 20;

export function SearchResultsPanel() {
  const nodes = useWorkspaceStore((s) => s.nodes);
  const addSearchHistory = useRecentFilesStore((s) => s.addSearchHistory);

  const [query, setQuery] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const options: SearchOptions = { isRegex, wholeWord, caseSensitive };

  const runSearch = useDebouncedCallback(async (q: string, opts: SearchOptions) => {
    if (!q) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    try {
      const r = await searchWorkspace(useWorkspaceStore.getState().nodes, q, opts);
      setResults(r);
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  }, 300);

  useEffect(() => {
    runSearch(query, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isRegex, wholeWord, caseSensitive, nodes]);

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  async function handleReplaceAll() {
    if (!query || totalMatches === 0) return;
    const summary = await replaceInFiles(nodes, query, replaceValue, options);
    toast.success(
      `Replaced ${summary.replacements} occurrence${summary.replacements === 1 ? "" : "s"} in ${summary.filesChanged} file${summary.filesChanged === 1 ? "" : "s"}`,
    );
    addSearchHistory({ query, isRegex, wholeWord, caseSensitive, timestamp: Date.now() });
    runSearch(query, options);
  }

  function toggleFileCollapsed(fileId: string) {
    setCollapsedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }

  const rows = useMemo<ResultRow[]>(() => {
    const out: ResultRow[] = [];
    for (const fileResult of results) {
      out.push({ kind: "file", fileResult });
      if (!collapsedFiles.has(fileResult.fileId)) {
        fileResult.matches.forEach((match, index) => {
          out.push({ kind: "match", fileId: fileResult.fileId, match, index });
        });
      }
    }
    return out;
  }, [results, collapsedFiles]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (rows[i].kind === "file" ? ROW_HEIGHT_FILE : ROW_HEIGHT_MATCH),
    overscan: 15,
  });

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="flex items-center gap-1 border-b p-1.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all files…"
          className="h-7 flex-1 text-xs"
          aria-label="Search across workspace"
        />
        <ToolbarButton
          icon={RegexIcon}
          label="Use Regular Expression"
          active={isRegex}
          onClick={() => setIsRegex((v) => !v)}
        />
        <ToolbarButton
          icon={WholeWord}
          label="Match Whole Word"
          active={wholeWord}
          onClick={() => setWholeWord((v) => !v)}
        />
        <ToolbarButton
          icon={CaseSensitive}
          label="Match Case"
          active={caseSensitive}
          onClick={() => setCaseSensitive((v) => !v)}
        />
        <ToolbarButton
          icon={Replace}
          label="Toggle Replace"
          active={showReplace}
          onClick={() => setShowReplace((v) => !v)}
        />
      </div>

      {showReplace && (
        <div className="flex items-center gap-1 border-b p-1.5">
          <Input
            value={replaceValue}
            onChange={(e) => setReplaceValue(e.target.value)}
            placeholder="Replace with…"
            className="h-7 flex-1 text-xs"
            aria-label="Replace with"
          />
          <Button size="sm" className="h-7" disabled={!query || totalMatches === 0} onClick={handleReplaceAll}>
            Replace All
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b px-2 py-1 text-xs text-muted-foreground">
        {searching ? (
          <span className="flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" /> Searching…
          </span>
        ) : hasSearched ? (
          <span>
            {totalMatches} result{totalMatches === 1 ? "" : "s"} in {results.length} file
            {results.length === 1 ? "" : "s"}
          </span>
        ) : (
          <span>Type to search the whole workspace</span>
        )}
      </div>

      <div ref={parentRef} className="np-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const height = row.kind === "file" ? ROW_HEIGHT_FILE : ROW_HEIGHT_MATCH;
            return (
              <div
                key={row.kind === "file" ? row.fileResult.fileId : `${row.fileId}:${row.index}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.kind === "file" ? (
                  <button
                    type="button"
                    onClick={() => toggleFileCollapsed(row.fileResult.fileId)}
                    className="flex h-full w-full items-center gap-1 px-2 text-left hover:bg-[var(--np-menu-hover)]"
                  >
                    {collapsedFiles.has(row.fileResult.fileId) ? (
                      <ChevronRight className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                    <span className="font-medium">{row.fileResult.fileName}</span>
                    <span className="truncate text-muted-foreground">{row.fileResult.filePath}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground">
                      {row.fileResult.matches.length}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openFileAtLocation(row.fileId, row.match.line, row.match.column)}
                    className="flex h-full w-full items-center gap-2 pr-2 pl-7 text-left font-mono text-xs hover:bg-[var(--np-menu-hover)]"
                  >
                    <span className="shrink-0 text-muted-foreground">{row.match.line}:</span>
                    <span className="truncate">
                      {row.match.lineText.slice(0, row.match.column - 1)}
                      <mark className="bg-yellow-300/60 text-inherit">
                        {row.match.lineText.slice(
                          row.match.column - 1,
                          row.match.column - 1 + row.match.length,
                        )}
                      </mark>
                      {row.match.lineText.slice(row.match.column - 1 + row.match.length)}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
