"use client";

import { ChevronRight, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/services/treeView/treeModel";

const VALUE_CLASS: Record<string, string> = {
  string: "text-emerald-700 dark:text-emerald-400",
  element: "text-emerald-700 dark:text-emerald-400",
  attribute: "text-emerald-700 dark:text-emerald-400",
  text: "text-emerald-700 dark:text-emerald-400",
  number: "text-sky-700 dark:text-sky-400",
  boolean: "text-violet-700 dark:text-violet-400",
  null: "text-muted-foreground italic",
};

/** Wraps every case-insensitive occurrence of the query in a highlight. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(q); at !== -1; at = lower.indexOf(q, from)) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className="rounded-[3px] bg-amber-300/60 text-inherit dark:bg-amber-400/35">
        {text.slice(at, at + q.length)}
      </mark>,
    );
    from = at + q.length;
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
}

function summary(node: TreeNode): string {
  const n = node.children?.length ?? 0;
  if (node.type === "array") return `[${n}]`;
  if (node.type === "object") return `{${n}}`;
  return `${n} item${n === 1 ? "" : "s"}`;
}

interface TreeViewRowProps {
  node: TreeNode;
  depth: number;
  expanded: boolean;
  selected: boolean;
  isMatch: boolean;
  isActiveMatch: boolean;
  query: string;
  highlightKeys: boolean;
  highlightValues: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onCopy: (what: "value" | "key" | "path") => void;
  onReveal: () => void;
}

export function TreeViewRow({
  node,
  depth,
  expanded,
  selected,
  isMatch,
  isActiveMatch,
  query,
  highlightKeys,
  highlightValues,
  onToggle,
  onSelect,
  onCopy,
  onReveal,
}: TreeViewRowProps) {
  const container = Boolean(node.children && node.children.length > 0);
  const quoted = node.type === "string";
  const showValue = !container && node.value !== undefined;

  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={container ? expanded : undefined}
      aria-selected={selected}
      onClick={onSelect}
      onDoubleClick={container ? onToggle : undefined}
      className={cn(
        "group flex h-full cursor-default items-center gap-1 pr-1 font-mono text-[12.5px] leading-none whitespace-nowrap transition-colors duration-100",
        selected ? "bg-primary/12" : "hover:bg-accent/60",
        isActiveMatch && "ring-primary/60 ring-1 ring-inset",
        !isMatch && query.trim() && "opacity-75",
      )}
      style={{ paddingLeft: 6 + depth * 14 }}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={expanded ? "Collapse" : "Expand"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "text-muted-foreground hover:text-foreground flex size-4 shrink-0 items-center justify-center rounded-sm",
          !container && "invisible",
        )}
      >
        <ChevronRight className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-90")} />
      </button>

      <span className={cn("shrink-0", node.type === "attribute" ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
        {highlightKeys ? <Highlighted text={node.key} query={query} /> : node.key}
      </span>

      {showValue ? (
        <>
          <span className="text-muted-foreground shrink-0">:</span>
          <span className={cn("min-w-0 truncate", VALUE_CLASS[node.type])}>
            {node.value === "" && node.type === "element" ? (
              <span className="text-muted-foreground italic">empty</span>
            ) : (
              <>
                {quoted && '"'}
                {highlightValues ? <Highlighted text={node.value!} query={query} /> : node.value}
                {quoted && '"'}
              </>
            )}
          </span>
        </>
      ) : (
        container && <span className="text-muted-foreground shrink-0 text-[11px]">{summary(node)}</span>
      )}

      <span className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger
          tabIndex={-1}
          aria-label={`Copy options for ${node.key}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "text-muted-foreground hover:text-foreground hover:bg-accent flex size-5 shrink-0 items-center justify-center rounded-sm opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100",
            selected && "opacity-100",
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={onReveal}>Show in text</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onCopy("value")}>Copy value</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onCopy("key")}>Copy key</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onCopy("path")}>Copy path</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
