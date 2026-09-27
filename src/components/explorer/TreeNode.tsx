"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Star,
  EyeOff,
  Lock,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu";
import { ExplorerContextMenuContent } from "./ExplorerContextMenuContent";
import { getFileIcon } from "@/lib/fileIcons";
import { cn } from "@/lib/utils";
import type { WorkspaceNode } from "@/types/file";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import {
  renameNode,
  moveNode,
  importNativeDrop,
  setFolderCollapsed,
} from "@/services/fileOperations";
import { openFileForUser } from "@/services/openFile";
import { isValidNodeName } from "@/lib/utils/pathUtils";
import { isDescendant } from "@/lib/utils/treeUtils";
import { toast } from "sonner";

interface TreeNodeProps {
  node: WorkspaceNode;
  depth: number;
}

export function TreeNode({ node, depth }: TreeNodeProps) {
  const isFavorite = useRecentFilesStore((s) => s.isFavorite(node.id));

  const isSelected = useExplorerSelectionStore(
    (s) => s.selectedNodeId === node.id,
  );
  const setSelectedNodeId = useExplorerSelectionStore(
    (s) => s.setSelectedNodeId,
  );
  const isRenaming = useExplorerSelectionStore(
    (s) => s.renamingNodeId === node.id,
  );
  const setRenamingNodeId = useExplorerSelectionStore(
    (s) => s.setRenamingNodeId,
  );
  const setDraggedNodeId = useExplorerSelectionStore((s) => s.setDraggedNodeId);
  const setDropTargetId = useExplorerSelectionStore((s) => s.setDropTargetId);

  const isFolder = node.type === "folder";
  const dropTarget = isFolder ? node.id : node.parentId;
  const isDropHighlighted = useExplorerSelectionStore(
    (s) => s.dropTargetId === dropTarget && s.draggedNodeId !== node.id,
  );

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
      setFolderCollapsed(node.id, !node.collapsed);
      return;
    }
    openFileForUser(node.id);
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
    if (useExplorerSelectionStore.getState().dropTargetId === dropTarget)
      setDropTargetId(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    if (e.dataTransfer.files.length > 0) {
      setDraggedNodeId(null);
      void importNativeDrop(e.dataTransfer, dropTarget);
      return;
    }

    const draggedId =
      e.dataTransfer.getData("text/plain") ||
      useExplorerSelectionStore.getState().draggedNodeId;
    setDraggedNodeId(null);
    if (!draggedId || draggedId === node.id) return;
    if (
      isFolder &&
      isDescendant(useWorkspaceStore.getState().nodes, draggedId, node.id)
    )
      return;
    moveNode(draggedId, dropTarget);
  }

  // getFileIcon returns a component — useMemo keeps the reference stable
  // (React Compiler forbids creating components directly in the render body)
  const Icon = useMemo(
    () =>
      isFolder
        ? node.collapsed
          ? Folder
          : FolderOpen
        : getFileIcon(node.name),
    [isFolder, node.collapsed, node.name],
  );

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
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
            className={cn(
              "group/item relative flex h-9 w-full items-center gap-1 rounded-md pr-1.5 text-left text-[12.5px] transition-[color,background-color] duration-100 outline-none sm:h-[28px]",
              "hover:bg-accent/70 hover:text-foreground focus-visible:ring-ring/20 focus-visible:ring-1",
              isSelected
                ? "bg-primary/10 text-primary before:bg-primary font-medium before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[2.5px] before:rounded-full"
                : "text-foreground/80",
              isDropHighlighted &&
                "ring-1 ring-primary/50 ring-inset",
              node.hidden && "italic opacity-45",
            )}
          >
            {isFolder ? (
              node.collapsed ? (
                <ChevronRight className="text-muted-foreground/50 size-3 shrink-0" />
              ) : (
                <ChevronDown className="text-muted-foreground/50 size-3 shrink-0" />
              )
            ) : (
              <span className="size-3 shrink-0" />
            )}
            <Icon className="size-3.5 shrink-0 opacity-70 transition-opacity group-hover/item:opacity-100" />
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
                className="border-ring/50 bg-background h-5 flex-1 rounded-sm border px-1 text-xs shadow-xs outline-none"
              />
            ) : (
              <span className="flex-1 truncate">{node.name}</span>
            )}
            {isFavorite && !isRenaming && (
              <Star className="size-2.5 shrink-0 fill-current text-amber-500/80" />
            )}
            {node.type === "file" && node.locked && !isRenaming && (
              <Lock className="text-muted-foreground/50 size-2.5 shrink-0" />
            )}
            {node.hidden && !isRenaming && (
              <EyeOff className="text-muted-foreground/50 size-2.5 shrink-0" />
            )}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent
          className="w-56"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <ExplorerContextMenuContent node={node} />
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
