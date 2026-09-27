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

  // eslint-disable-next-line react-hooks/static-components
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
            "focus-visible:ring-ring/30 focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset",
            "group relative flex h-9 min-w-0 shrink-0 cursor-default items-center gap-1.5 border-r px-3 text-[12.5px] transition-[color,background-color] duration-100 select-none",
            isActive
              ? "text-foreground after:bg-primary bg-[var(--np-tab-active-bg)] font-medium after:absolute after:inset-x-0 after:bottom-0 after:h-[2px]"
              : "text-muted-foreground/70 hover:text-foreground/90 hover:bg-[var(--np-menu-hover)]/60",
          )}
          style={{ borderColor: "var(--np-tab-border)" }}
          title={node?.path}
        >
          {tab.pinned && (
            <Pin className="text-primary size-2.5 shrink-0 fill-current opacity-70" />
          )}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Icon className="size-3.5 shrink-0 opacity-75 transition-opacity group-hover:opacity-100" />
          <span className="max-w-36 truncate">{node?.name ?? "Untitled"}</span>
          <span className="relative ml-0.5 flex size-3.5 shrink-0 items-center justify-center">
            {isDirty && (
              <span
                className="bg-primary size-1.5 rounded-full group-hover:hidden"
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
                "hover:bg-destructive/12 hover:text-destructive focus-visible:ring-ring absolute inset-0 flex items-center justify-center rounded-sm transition-all duration-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:outline-none active:scale-95",
                isDirty
                  ? "hidden group-hover:flex focus-visible:flex [@media(hover:none)]:flex"
                  : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
              )}
            >
              <X className="size-2.5" />
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
