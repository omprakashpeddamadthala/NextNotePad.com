"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleAlert,
  ListTree,
  Search,
  X,
} from "lucide-react";
import { SkeletonText } from "@/components/ui/skeleton";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useLiveNoteText } from "@/hooks/useLiveNoteText";
import { usePendingGotoStore } from "@/store/pendingGotoStore";
import { copyText } from "@/services/copyNote";
import { MAX_TREE_CHARS, parseNoteTree } from "@/services/treeView/parseNote";
import {
  containerIdsToLevel,
  findNode,
  searchTree,
  visibleRows,
} from "@/services/treeView/searchTree";
import {
  isContainer,
  type TreeFormat,
  type TreeNode,
  type TreeParseError,
} from "@/services/treeView/treeModel";
import { TreeViewRow } from "./TreeViewRow";

const FORMAT_LABEL: Record<TreeFormat, string> = {
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
};
const DEFAULT_LEVEL = 2;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-6 shrink-0 rounded-full border px-2.5 whitespace-nowrap text-[11px] font-medium transition-colors duration-150",
        active
          ? "border-primary/40 bg-primary/12 text-foreground"
          : "border-border/70 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface TreeViewPanelProps {
  fileId: string;
  format: TreeFormat;
  /** Shown next to the text instead of covering it, so row clicks can jump the text. */
  beside?: boolean;
  onClose: () => void;
}

/** Collapsible, searchable tree of a JSON, YAML or XML note. Mount with key={fileId}. */
export function TreeViewPanel({
  fileId,
  format,
  beside = false,
  onClose,
}: TreeViewPanelProps) {
  const isMobile = useIsMobile();
  const rowHeight = isMobile ? 34 : 24;
  const { text, failed } = useLiveNoteText(fileId);

  const [good, setGood] = useState<{ root: TreeNode; text: string } | null>(
    null,
  );
  const [error, setError] = useState<{
    text: string;
    error: TreeParseError;
  } | null>(null);
  const [expanded, setExpanded] = useState<Set<string> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchKeys, setSearchKeys] = useState(true);
  const [searchValues, setSearchValues] = useState(true);
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [activeMatch, setActiveMatch] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const listRef = useRef<HTMLDivElement>(null);

  const tooLarge = text !== null && text.length > MAX_TREE_CHARS;

  useEffect(() => {
    if (text === null || text.length > MAX_TREE_CHARS) return;
    let cancelled = false;
    void parseNoteTree(text, format).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setGood({ root: result.root, text });
        setError(null);
      } else {
        setError({ text, error: result.error });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [text, format]);

  const root = good?.root ?? null;
  const parseError = error && error.text === text ? error.error : null;
  const openIds = useMemo(
    () =>
      expanded ??
      (root ? containerIdsToLevel(root, DEFAULT_LEVEL) : new Set<string>()),
    [expanded, root],
  );

  const search = useMemo(
    () =>
      root
        ? searchTree(root, {
            query: deferredQuery,
            keys: searchKeys,
            values: searchValues,
          })
        : null,
    [root, deferredQuery, searchKeys, searchValues],
  );
  const searching =
    Boolean(deferredQuery.trim()) && (searchKeys || searchValues);
  const matchIds = useMemo(() => new Set(search?.matches ?? []), [search]);
  const matchCount = search?.matches.length ?? 0;
  const activeIndex =
    matchCount > 0
      ? ((activeMatch % matchCount) + matchCount) % matchCount
      : -1;
  const activeId = activeIndex >= 0 ? search!.matches[activeIndex] : null;

  const rows = useMemo(() => {
    if (!root) return [];
    const open =
      searching && search
        ? new Set([...openIds, ...search.ancestors])
        : openIds;
    const only =
      searching && onlyMatches && search
        ? new Set([...search.matches, ...search.ancestors])
        : undefined;
    return visibleRows(root, open, only);
  }, [root, openIds, searching, onlyMatches, search]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => rowHeight,
    overscan: 20,
  });

  // Keep the current match in view as the user steps through results.
  useEffect(() => {
    if (!activeId) return;
    const index = rows.findIndex((r) => r.node.id === activeId);
    if (index >= 0) virtualizer.scrollToIndex(index, { align: "center" });
  }, [activeId, rows, virtualizer]);

  function setOpen(next: Set<string>) {
    setExpanded(new Set(next));
  }
  function toggle(node: TreeNode) {
    const next = new Set(openIds);
    if (next.has(node.id)) next.delete(node.id);
    else next.add(node.id);
    setOpen(next);
  }
  function reveal(node: TreeNode) {
    usePendingGotoStore.getState().requestGoto(fileId, node.line, node.column);
    if (!beside) onClose();
  }
  function select(node: TreeNode) {
    setSelectedId(node.id);
    if (beside) reveal(node);
    else if (isMobile && isContainer(node)) toggle(node);
  }
  function copy(node: TreeNode, what: "value" | "key" | "path") {
    if (what === "key") return void copyText(node.key, "Key copied");
    if (what === "path") return void copyText(node.id, "Path copied");
    const value =
      isContainer(node) || node.value === undefined
        ? good!.text.slice(node.start, node.end)
        : node.value;
    void copyText(value, "Value copied");
  }
  function stepMatch(delta: number) {
    if (matchCount === 0) return;
    const next = activeIndex + delta;
    setActiveMatch(next);
    const id = search!.matches[((next % matchCount) + matchCount) % matchCount];
    setSelectedId(id);
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    const index = rows.findIndex((r) => r.node.id === selectedId);
    const row = rows[index];
    const move = (i: number) => {
      const target = rows[Math.max(0, Math.min(rows.length - 1, i))];
      if (!target) return;
      setSelectedId(target.node.id);
      virtualizer.scrollToIndex(rows.indexOf(target));
    };
    if (e.key === "ArrowDown") move(index + 1);
    else if (e.key === "ArrowUp") move(index < 0 ? 0 : index - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(rows.length - 1);
    else if (e.key === "ArrowRight" && row) {
      if (isContainer(row.node) && !openIds.has(row.node.id)) toggle(row.node);
      else if (isContainer(row.node)) move(index + 1);
    } else if (e.key === "ArrowLeft" && row) {
      if (isContainer(row.node) && openIds.has(row.node.id)) toggle(row.node);
      else {
        const parentIndex = rows
          .slice(0, index)
          .findLastIndex((r) => r.depth < row.depth);
        if (parentIndex >= 0) move(parentIndex);
      }
    } else if (e.key === "Enter" && row) reveal(row.node);
    else return;
    e.preventDefault();
  }

  const body = (() => {
    if (failed)
      return <Empty icon={CircleAlert} title="Couldn't read this note" />;
    if (tooLarge) {
      return (
        <Empty
          icon={CircleAlert}
          title="This file is too large for the tree view"
        >
          Tree view works with files up to{" "}
          {(MAX_TREE_CHARS / 1_000_000).toFixed(0)} MB.
        </Empty>
      );
    }
    if (!root && parseError) return null;
    if (!root) {
      return (
        <div className="p-4">
          <SkeletonText lines={8} />
        </div>
      );
    }
    if (searching && matchCount === 0) {
      return (
        <Empty
          icon={Search}
          title={`No ${searchKeys && !searchValues ? "keys" : !searchKeys ? "values" : "keys or values"} match "${deferredQuery.trim()}"`}
        />
      );
    }
    return (
      <div
        ref={listRef}
        role="tree"
        aria-label={`${FORMAT_LABEL[format]} tree`}
        tabIndex={0}
        onKeyDown={onListKeyDown}
        className={cn(
          "np-scrollbar focus-visible:ring-ring/40 h-full overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-inset",
          parseError && "opacity-50",
        )}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
            minWidth: "100%",
            width: "max-content",
          }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const { node, depth } = rows[item.index];
            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <TreeViewRow
                  node={node}
                  depth={depth}
                  expanded={
                    openIds.has(node.id) ||
                    Boolean(searching && search?.ancestors.has(node.id))
                  }
                  selected={selectedId === node.id}
                  isMatch={matchIds.has(node.id)}
                  isActiveMatch={activeId === node.id}
                  query={searching ? deferredQuery : ""}
                  highlightKeys={searchKeys}
                  highlightValues={searchValues}
                  onToggle={() => toggle(node)}
                  onSelect={() => select(node)}
                  onCopy={(what) => copy(node, what)}
                  onReveal={() => reveal(node)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  })();

  return (
    <section
      aria-label="Tree view"
      className="bg-background @container flex h-full min-w-0 flex-col border-l"
    >
      {/* One line; when narrow the label hides, then the row scrolls sideways rather than wrapping. */}
      <div className="border-border/60 no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b px-2.5 py-1.5">
        <ListTree className="text-primary size-4 shrink-0" />
        <span className="text-muted-foreground mr-1 shrink-0 text-xs font-semibold tracking-wide uppercase @max-2xl:hidden">
          {FORMAT_LABEL[format]} tree
        </span>
        <div className="relative min-w-32 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveMatch(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                stepMatch(e.shiftKey ? -1 : 1);
              } else if (e.key === "Escape" && query) {
                e.preventDefault();
                setQuery("");
              }
            }}
            placeholder="Search keys and values"
            aria-label="Search the tree"
            className="border-border/70 bg-background/60 focus-visible:border-primary/50 focus-visible:ring-primary/20 h-7 w-full rounded-md border pr-2 pl-7 text-xs outline-none focus-visible:ring-2"
          />
        </div>
        {searching && (
          <span
            className="text-muted-foreground shrink-0 text-[11px] tabular-nums"
            aria-live="polite"
          >
            {matchCount === 0 ? "0" : `${activeIndex + 1} of ${matchCount}`}
          </span>
        )}
        <ToolbarButton
          icon={ChevronUp}
          label="Previous match (Shift+Enter)"
          size="compact"
          disabled={matchCount === 0}
          onClick={() => stepMatch(-1)}
        />
        <ToolbarButton
          icon={ChevronDown}
          label="Next match (Enter)"
          size="compact"
          disabled={matchCount === 0}
          onClick={() => stepMatch(1)}
        />
        <Chip active={searchKeys} onClick={() => setSearchKeys((v) => !v)}>
          Keys
        </Chip>
        <Chip active={searchValues} onClick={() => setSearchValues((v) => !v)}>
          Values
        </Chip>
        <Chip active={onlyMatches} onClick={() => setOnlyMatches((v) => !v)}>
          Only matches
        </Chip>
        <ToolbarButton
          icon={ChevronsUpDown}
          label="Expand all"
          size="compact"
          disabled={!root}
          onClick={() => root && setOpen(containerIdsToLevel(root, Infinity))}
        />
        <ToolbarButton
          icon={ChevronsDownUp}
          label="Collapse all"
          size="compact"
          disabled={!root}
          onClick={() => setOpen(new Set())}
        />
        <div
          className="border-border/70 flex shrink-0 items-center overflow-hidden rounded-md border"
          role="group"
          aria-label="Expand to level"
        >
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              disabled={!root}
              title={`Expand to level ${level}`}
              aria-label={`Expand to level ${level}`}
              onClick={() => root && setOpen(containerIdsToLevel(root, level))}
              className="text-muted-foreground hover:bg-accent hover:text-foreground h-6 w-6 text-[11px] font-medium tabular-nums transition-colors disabled:opacity-40"
            >
              {level}
            </button>
          ))}
        </div>
        <ToolbarButton
          icon={X}
          label="Close tree view (Alt+T)"
          size="compact"
          onClick={onClose}
        />
      </div>

      {parseError && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 border-b px-3 py-2 text-xs"
        >
          <CircleAlert className="mt-px size-3.5 shrink-0" />
          <span>
            <strong className="font-semibold">
              Line {parseError.line}, column {parseError.column}:
            </strong>{" "}
            {parseError.message}
            {root && (
              <span className="text-muted-foreground">
                {" "}
                · showing the last valid version
              </span>
            )}
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1">{body}</div>

      {selectedId && root && !isMobile && (
        <div
          className="text-muted-foreground border-border/60 truncate border-t px-3 py-1 font-mono text-[11px]"
          title={selectedId}
        >
          {findNode(root, selectedId) ? selectedId : ""}
        </div>
      )}
    </section>
  );
}

function Empty({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Search;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <Icon className="text-muted-foreground size-5" />
      <p className="text-sm font-medium">{title}</p>
      {children && (
        <p className="text-muted-foreground max-w-xs text-xs">{children}</p>
      )}
    </div>
  );
}
