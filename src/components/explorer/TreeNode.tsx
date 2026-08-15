"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Star, EyeOff, Lock } from "lucide-react";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent } from "@/components/ui/context-menu";
import { ExplorerContextMenuContent } from "./ExplorerContextMenuContent";
import { getFileIcon } from "@/lib/fileIcons";
import { cn } from "@/lib/utils";
import type { WorkspaceNode } from "@/types/file";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { useTabsStore } from "@/store/tabsStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { renameNode, moveNode } from "@/services/fileOperations";
import { isValidNodeName } from "@/lib/utils/pathUtils";
import { isDescendant } from "@/lib/utils/treeUtils";
import { toast } from "sonner";

interface TreeNodeProps {
  node: WorkspaceNode;
  depth: number;
}

export function TreeNode({ node, depth }: TreeNodeProps) {
  const toggleCollapsed = useWorkspaceStore((s) => s.toggleCollapsed);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const openTab = useTabsStore((s) => s.openTab);
  const addRecent = useRecentFilesStore((s) => s.addRecent);
  const isFavorite = useRecentFilesStore((s) => s.isFavorite(node.id));

  const selectedNodeId = useExplorerSelectionStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useExplorerSelectionStore((s) => s.setSelectedNodeId);
  const renamingNodeId = useExplorerSelectionStore((s) => s.renamingNodeId);
  const setRenamingNodeId = useExplorerSelectionStore((s) => s.setRenamingNodeId);
  const draggedNodeId = useExplorerSelectionStore((s) => s.draggedNodeId);
  const setDraggedNodeId = useExplorerSelectionStore((s) => s.setDraggedNodeId);
  const dropTargetId = useExplorerSelectionStore((s) => s.dropTargetId);
  const setDropTargetId = useExplorerSelectionStore((s) => s.setDropTargetId);

  const isSelected = selectedNodeId === node.id;
  const isRenaming = renamingNodeId === node.id;
  const isFolder = node.type === "folder";
  const dropTarget = isFolder ? node.id : node.parentId;
  const isDropHighlighted = dropTargetId === dropTarget && draggedNodeId !== node.id;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenaming) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const dot = node.name.lastIndexOf(".");
      inputRef.current?.setSelectionRange(0, dot > 0 ? dot : node.name.length);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRenaming]);

  function commitRename() {
    const trimmed = inputRef.current?.value.trim() ?? "";
    setRenamingNodeId(null);
    if (!trimmed || trimmed === node.name) return;
    if (!isValidNodeName(trimmed)) {
      toast.error("Invalid name.");
      return;
    }
    try {
      renameNode(node.id, trimmed);
    } catch {
      // duplicate-name toast already shown by renameNode
    }
  }

  function handleClick() {
    setSelectedNodeId(node.id);
    if (isFolder) {
      toggleCollapsed(node.id);
    } else {
      openTab(node.id);
      addRecent(node.id);
    }
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", node.id);
    setDraggedNodeId(node.id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetId(dropTarget);
  }

  function handleDragLeave() {
    if (dropTargetId === dropTarget) setDropTargetId(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropTargetId(null);
    const draggedId = e.dataTransfer.getData("text/plain") || draggedNodeId;
    setDraggedNodeId(null);
    if (!draggedId || draggedId === node.id) return;
    if (isFolder && isDescendant(nodes, draggedId, node.id)) return;
    moveNode(draggedId, dropTarget);
  }

  const Icon = isFolder ? (node.collapsed ? Folder : FolderOpen) : getFileIcon(node.name);

  return (
    <div
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={isFolder ? !node.collapsed : undefined}
      tabIndex={-1}
      draggable={!isRenaming}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={() => {
        setDraggedNodeId(null);
        setDropTargetId(null);
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            style={{ paddingLeft: `${depth * 14 + 6}px` }}
            className={cn(
              "flex h-6 w-full items-center gap-1 pr-2 text-left text-[13px] outline-none",
              "hover:bg-[var(--np-menu-hover)] focus-visible:ring-1 focus-visible:ring-ring",
              isSelected && "bg-accent text-accent-foreground",
              isDropHighlighted && "outline outline-1 outline-primary",
              node.hidden && "opacity-50 italic",
            )}
          >
            {isFolder ? (
              node.collapsed ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              )
            ) : (
              <span className="size-3.5 shrink-0" />
            )}
            {/* Icon is chosen from a fixed set of stable icon components, not created during render. */}
            {/* eslint-disable-next-line react-hooks/static-components */}
            <Icon className="size-3.5 shrink-0" />
            {isRenaming ? (
              <input
                ref={inputRef}
                defaultValue={node.name}
                onClick={(e) => e.stopPropagation()}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setRenamingNodeId(null);
                  }
                }}
                className="h-5 flex-1 rounded-sm border border-ring bg-background px-1 text-[13px] outline-none"
              />
            ) : (
              <span className="flex-1 truncate">{node.name}</span>
            )}
            {isFavorite && !isRenaming && <Star className="size-3 shrink-0 fill-current text-amber-500" />}
            {node.type === "file" && node.locked && !isRenaming && (
              <Lock className="size-3 shrink-0 text-muted-foreground" />
            )}
            {node.hidden && !isRenaming && <EyeOff className="size-3 shrink-0 text-muted-foreground" />}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
          <ExplorerContextMenuContent node={node} />
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
