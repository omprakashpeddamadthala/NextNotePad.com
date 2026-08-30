"use client";

import { X, Pin, FileDiff } from "lucide-react";
import { getFileIcon } from "@/lib/fileIcons";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import type { Tab, WorkspaceNode } from "@/types/file";
import { useTabsStore } from "@/store/tabsStore";
import { useDiffViewStore } from "@/store/diffViewStore";

interface TabItemProps {
  tab: Tab;
  node: WorkspaceNode | undefined;
  isActive: boolean;
  isDirty: boolean;
  index: number;
  onActivate: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
}

export function TabItem({ tab, node, isActive, isDirty, index, onActivate, onDragStart, onDragOver, onDrop }: TabItemProps) {
  const closeTab = useTabsStore((s) => s.closeTab);
  const closeOthers = useTabsStore((s) => s.closeOthers);
  const closeLeft = useTabsStore((s) => s.closeLeft);
  const closeRight = useTabsStore((s) => s.closeRight);
  const pinTab = useTabsStore((s) => s.pinTab);

  const Icon = getFileIcon(node?.name ?? "file.txt");

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          draggable
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(index);
          }}
          onDrop={onDrop}
          onClick={onActivate}
          onAuxClick={(e) => {
            if (e.button === 1) closeTab(tab.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onActivate();
            } else if (e.key === "Delete" || e.key === "Backspace") {
              e.preventDefault();
              closeTab(tab.id);
            }
          }}
          role="tab"
          tabIndex={0}
          aria-selected={isActive}
          className={cn(
            "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
            "group relative flex h-8 shrink-0 cursor-default items-center gap-1.5 border-r px-2.5 text-xs transition-colors select-none",
            // A 2px top accent on the active tab — the background alone is a subtle difference in
            // the lighter themes, and this is the standard editor cue for "you are here".
            isActive
              ? "bg-[var(--np-tab-active-bg)] text-foreground before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary"
              : "bg-[var(--np-tab-inactive-bg)] text-muted-foreground hover:bg-[var(--np-menu-hover)] hover:text-foreground",
          )}
          style={{ borderColor: "var(--np-tab-border)" }}
          title={node?.path}
        >
          {tab.pinned && <Pin className="size-3 shrink-0 fill-current" />}
          {/* Icon is chosen from a fixed set of stable icon components, not created during render. */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Icon className="size-3.5 shrink-0" />
          <span className="max-w-40 truncate">{node?.name ?? "Untitled"}</span>
          <span className="relative ml-1 flex size-4 shrink-0 items-center justify-center">
            {isDirty && (
              <span
                className="size-2 rounded-full bg-foreground/70 group-hover:hidden"
                aria-label="Unsaved changes"
              />
            )}
            <button
              type="button"
              aria-label={`Close ${node?.name ?? "tab"}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-sm hover:bg-[var(--np-menu-hover)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                // group-hover reveals the close button on devices that support hovering; touch devices get no hover state at all, so they'd otherwise never see it.
                isDirty ? "hidden group-hover:flex focus-visible:flex [@media(hover:none)]:flex" : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
              )}
            >
              <X className="size-3.5" />
            </button>
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={() => pinTab(tab.id, !tab.pinned)}>
          {tab.pinned ? "Unpin Tab" : "Pin Tab"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => closeTab(tab.id)}>Close</ContextMenuItem>
        <ContextMenuItem onSelect={() => closeOthers(tab.id)}>Close Others</ContextMenuItem>
        <ContextMenuItem onSelect={() => closeLeft(tab.id)}>Close to the Left</ContextMenuItem>
        <ContextMenuItem onSelect={() => closeRight(tab.id)}>Close to the Right</ContextMenuItem>
        {!isActive && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                const activeTabId = useTabsStore.getState().activeTabId;
                if (activeTabId) useDiffViewStore.getState().openDiff(activeTabId, tab.id);
              }}
            >
              <FileDiff /> Compare with Active Tab
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
