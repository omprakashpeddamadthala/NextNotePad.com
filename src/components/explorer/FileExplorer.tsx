"use client";

import { useState } from "react";
import { FilePlus, FolderPlus, ChevronsDownUp, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { FileTree } from "./FileTree";
import { Breadcrumb } from "./Breadcrumb";
import { RecycleBinPanel } from "@/components/trash/RecycleBinPanel";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTrashStore } from "@/store/trashStore";
import { useCreateAndRename } from "@/hooks/useCreateAndRename";
import { importNativeFiles } from "@/services/fileOperations";

export function FileExplorer() {
  const [showTrash, setShowTrash] = useState(false);
  const [search, setSearch] = useState("");
  const filterQuery = useWorkspaceStore((s) => s.filterQuery);
  const setFilterQuery = useWorkspaceStore((s) => s.setFilterQuery);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const setCollapsed = useWorkspaceStore((s) => s.setCollapsed);
  const trashCount = useTrashStore((s) => s.entries.length);
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();

  return (
    <div
      className="flex h-full flex-col bg-background"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length > 0) {
          e.preventDefault();
          void importNativeFiles(e.dataTransfer.files, null);
        }
      }}
    >
      <div className="flex h-8 shrink-0 items-center gap-1 border-b px-2">
        <span className="flex-1 truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {showTrash ? "Recycle Bin" : "Explorer"}
        </span>
        {!showTrash && (
          <>
            <ToolbarButton icon={FilePlus} label="New File" onClick={() => createFileAndRename(null)} />
            <ToolbarButton icon={FolderPlus} label="New Folder" onClick={() => createFolderAndRename(null)} />
            <ToolbarButton
              icon={ChevronsDownUp}
              label="Collapse All"
              onClick={() => {
                for (const node of Object.values(nodes)) {
                  if (node.type === "folder") setCollapsed(node.id, true);
                }
              }}
            />
          </>
        )}
        <ToolbarButton
          icon={Trash2}
          label={showTrash ? "Back to Explorer" : `Recycle Bin (${trashCount})`}
          active={showTrash}
          onClick={() => setShowTrash((v) => !v)}
        />
      </div>

      {!showTrash && (
        <div className="relative flex h-8 shrink-0 items-center border-b px-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilterQuery(e.target.value);
            }}
            placeholder="Filter files…"
            className="h-6 text-xs"
            aria-label="Filter files in explorer"
          />
          {filterQuery && (
            <button
              type="button"
              aria-label="Clear filter"
              className="absolute right-3.5 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearch("");
                setFilterQuery("");
              }}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {!showTrash && <Breadcrumb />}

      <div className="min-h-0 flex-1">{showTrash ? <RecycleBinPanel /> : <FileTree />}</div>
    </div>
  );
}
