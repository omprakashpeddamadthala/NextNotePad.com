"use client";

import {
  FilePlus,
  FolderPlus,
  Pencil,
  Copy,
  Trash2,
  Star,
  ChevronsDownUp,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";
import { ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import type { WorkspaceNode } from "@/types/file";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { duplicateNode, moveToTrash, toggleNodeHidden, setFolderCollapsed } from "@/services/fileOperations";
import { useCreateAndRename } from "@/hooks/useCreateAndRename";
import { useLockDialogStore } from "@/store/lockDialogStore";
import { collectSubtree } from "@/lib/utils/treeUtils";

export function ExplorerContextMenuContent({ node }: { node: WorkspaceNode }) {
  const setRenamingNodeId = useExplorerSelectionStore((s) => s.setRenamingNodeId);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const toggleFavorite = useRecentFilesStore((s) => s.toggleFavorite);
  const isFavorite = useRecentFilesStore((s) => s.isFavorite(node.id));
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();
  const openLockDialog = useLockDialogStore((s) => s.openLockDialog);
  const openUnlockDialog = useLockDialogStore((s) => s.openUnlockDialog);

  const containerId = node.type === "folder" ? node.id : node.parentId;

  return (
    <>
      <ContextMenuItem onSelect={() => createFileAndRename(containerId)}>
        <FilePlus /> New File
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => createFolderAndRename(containerId)}>
        <FolderPlus /> New Folder
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={() => setRenamingNodeId(node.id)}>
        <Pencil /> Rename
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => void duplicateNode(node.id)}>
        <Copy /> Duplicate
      </ContextMenuItem>
      {node.type === "file" && (
        <ContextMenuItem onSelect={() => toggleFavorite(node.id)}>
          <Star /> {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        </ContextMenuItem>
      )}
      <ContextMenuItem onSelect={() => toggleNodeHidden(node.id)}>
        {node.hidden ? <Eye /> : <EyeOff />} {node.hidden ? "Unhide" : "Hide"}
      </ContextMenuItem>
      {node.type === "file" &&
        (node.locked ? (
          <ContextMenuItem onSelect={() => openUnlockDialog(node.id)}>
            <Unlock /> Unlock
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={() => openLockDialog(node.id)}>
            <Lock /> Lock
          </ContextMenuItem>
        ))}
      {node.type === "folder" && (
        <>
          <ContextMenuItem onSelect={() => openLockDialog(node.id)}>
            <Lock /> Lock Folder…
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => openUnlockDialog(node.id)}>
            <Unlock /> Unlock Folder…
          </ContextMenuItem>
        </>
      )}
      {node.type === "folder" && (
        <ContextMenuItem
          onSelect={() => {
            for (const child of collectSubtree(nodes, node.id)) {
              if (child.type === "folder") setFolderCollapsed(child.id, true);
            }
          }}
        >
          <ChevronsDownUp /> Collapse All Children
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onSelect={() => moveToTrash(node.id)}>
        <Trash2 /> Delete
      </ContextMenuItem>
    </>
  );
}
