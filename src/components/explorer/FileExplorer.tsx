"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronsDownUp,
  FilePlus,
  FolderPlus,
  Layers,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { FileTree } from "./FileTree";
import { RecycleBinPanel } from "@/components/trash/RecycleBinPanel";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTrashStore } from "@/store/trashStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useCreateAndRename } from "@/hooks/useCreateAndRename";
import { useNewNodeTargetParentId } from "@/hooks/useNewNodeTargetParentId";
import {
  importNativeDrop,
  setFolderCollapsed,
} from "@/services/fileOperations";

export function FileExplorer() {
  const showTrash = useUIStore((s) => s.explorerShowTrash);
  const setShowTrash = useUIStore((s) => s.setExplorerShowTrash);
  const setMobileWorkspaceSheetOpen = useUIStore(
    (s) => s.setMobileWorkspaceSheetOpen,
  );
  const authStatus = useAuthStore((s) => s.status);
  const workspaceName = useMultiWorkspaceStore(
    (s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId)?.name,
  );
  const [search, setSearch] = useState("");
  const filterQuery = useWorkspaceStore((s) => s.filterQuery);
  const setFilterQuery = useWorkspaceStore((s) => s.setFilterQuery);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const trashCount = useTrashStore((s) => s.entries.length);
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();
  const targetParentId = useNewNodeTargetParentId();

  return (
    <div
      role="complementary"
      aria-label="File Explorer"
      className="bg-background flex h-full flex-col"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length > 0) {
          e.preventDefault();
          void importNativeDrop(e.dataTransfer, null);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setMobileWorkspaceSheetOpen(true)}
        className="active:bg-accent/60 flex shrink-0 items-center gap-3 border-b px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 text-left transition-colors duration-150"
      >
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
          <Layers className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-muted-foreground block text-[11px] font-medium">
            Workspace
          </span>
          <span className="text-foreground block truncate text-[15px] font-semibold">
            {authStatus === "guest"
              ? "Guest workspace"
              : (workspaceName ?? "My Workspace")}
          </span>
        </span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
      </button>

      <div className="flex h-12 shrink-0 items-center gap-0.5 border-b px-2">
        <span
          className="text-muted-foreground min-w-0 flex-1 truncate px-2 text-xs font-semibold tracking-wide uppercase"
          title={showTrash ? "Recycle Bin" : "Explorer"}
        >
          {showTrash ? "Recycle Bin" : "Explorer"}
        </span>
        {!showTrash && (
          <>
            <ToolbarButton
              icon={FilePlus}
              label="New File"
              size="touch"
              onClick={() => createFileAndRename(targetParentId)}
            />
            <ToolbarButton
              icon={FolderPlus}
              label="New Folder"
              size="touch"
              onClick={() => createFolderAndRename(targetParentId)}
            />
            <ToolbarButton
              icon={ChevronsDownUp}
              label="Collapse All"
              size="touch"
              onClick={() => {
                for (const node of Object.values(nodes)) {
                  if (node.type === "folder") setFolderCollapsed(node.id, true);
                }
              }}
            />
          </>
        )}
        <ToolbarButton
          icon={Trash2}
          label={showTrash ? "Back to Explorer" : `Recycle Bin (${trashCount})`}
          active={showTrash}
          size="touch"
          onClick={() => setShowTrash(!showTrash)}
        />
      </div>

      {!showTrash && (
        <div className="relative flex h-14 shrink-0 items-center border-b px-3">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilterQuery(e.target.value);
            }}
            placeholder="Filter files…"
            className="h-10 rounded-xl pr-9 text-base"
            aria-label="Filter files in explorer"
          />
          {filterQuery && (
            <button
              type="button"
              aria-label="Clear filter"
              className="text-muted-foreground hover:text-foreground absolute right-5 flex size-7 items-center justify-center"
              onClick={() => {
                setSearch("");
                setFilterQuery("");
              }}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {showTrash ? <RecycleBinPanel /> : <FileTree />}
      </div>
    </div>
  );
}
