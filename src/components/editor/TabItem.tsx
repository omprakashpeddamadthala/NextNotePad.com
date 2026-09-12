"use client";

import { X, Pin, FileDiff } from "lucide-react";
import { getFileIcon } from "@/lib/fileIcons";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
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

export function TabItem({
  tab,
  node,
  isActive,
  isDirty,
  index,
  onActivate,
  onDragStart,
  onDragOver,
  onDrop,
}: TabItemProps) {
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
            "focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
            "group relative flex h-10 min-w-0 shrink-0 cursor-default items-center gap-2 border-r px-3.5 text-[13px] transition-[color,background-color,box-shadow] duration-150 select-none",
            // Modern bottom accent on active tab
            isActive
              ? "text-foreground after:bg-primary bg-[var(--np-tab-active-bg)] font-semibold shadow-[0_-1px_0_var(--np-tab-border),0_4px_12px_-10px_rgba(15,23,42,0.45)] after:absolute after:inset-x-0 after:bottom-0 after:h-[2px]"
              : "text-muted-foreground/75 hover:text-foreground bg-transparent hover:bg-[var(--np-menu-hover)]",
          )}
          style={{ borderColor: "var(--np-tab-border)" }}
          title={node?.path}
        >
          {tab.pinned && (
            <Pin className="text-primary size-3 shrink-0 fill-current opacity-70" />
          )}
          {/* Icon is chosen from a fixed set of stable icon components, not created during render. */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Icon className="size-4 shrink-0 opacity-80 transition-opacity group-hover:opacity-100" />
          <span className="max-w-40 truncate">{node?.name ?? "Untitled"}</span>
          <span className="relative ml-0.5 flex size-4 shrink-0 items-center justify-center">
            {isDirty && (
              <span
                className="bg-primary ring-primary/15 size-2 rounded-full ring-2 group-hover:hidden"
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
                "hover:bg-muted-foreground/20 focus-visible:ring-ring absolute inset-0 flex items-center justify-center rounded-sm transition-all duration-150 hover:scale-110 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95",
                isDirty
                  ? "hidden group-hover:flex focus-visible:flex [@media(hover:none)]:flex"
                  : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
              )}
            >
              <X className="size-3" />
            </button>
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={() => pinTab(tab.id, !tab.pinned)}>
          {tab.pinned ? "Unpin Tab" : "Pin Tab"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => closeTab(tab.id)}>
          Close
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => closeOthers(tab.id)}>
          Close Others
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => closeLeft(tab.id)}>
          Close to the Left
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => closeRight(tab.id)}>
          Close to the Right
        </ContextMenuItem>
        {!isActive && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                const activeTabId = useTabsStore.getState().activeTabId;
                if (activeTabId)
                  useDiffViewStore.getState().openDiff(activeTabId, tab.id);
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
