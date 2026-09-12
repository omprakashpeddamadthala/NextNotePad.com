"use client";

import { useState } from "react";
import { ChevronsDownUp, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { FileTree } from "./FileTree";
import { RecycleBinPanel } from "@/components/trash/RecycleBinPanel";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTrashStore } from "@/store/trashStore";
import {
  importNativeDrop,
  setFolderCollapsed,
} from "@/services/fileOperations";

export function FileExplorer() {
  const [showTrash, setShowTrash] = useState(false);
  const [search, setSearch] = useState("");
  const filterQuery = useWorkspaceStore((s) => s.filterQuery);
  const setFilterQuery = useWorkspaceStore((s) => s.setFilterQuery);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const trashCount = useTrashStore((s) => s.entries.length);

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
      <div className="flex h-8 shrink-0 items-center gap-0.5 border-b px-2">
        <span
          className="text-muted-foreground min-w-0 flex-1 truncate text-xs font-semibold uppercase"
          title={showTrash ? "Recycle Bin" : "Explorer"}
        >
          {showTrash ? "Recycle Bin" : "Explorer"}
        </span>
        {!showTrash && (
          <>
            <ToolbarButton
              icon={ChevronsDownUp}
              label="Collapse All"
              size="compact"
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
          size="compact"
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
              className="text-muted-foreground hover:text-foreground absolute right-3.5"
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

      <div className="min-h-0 flex-1">
        {showTrash ? <RecycleBinPanel /> : <FileTree />}
      </div>
    </div>
  );
}
