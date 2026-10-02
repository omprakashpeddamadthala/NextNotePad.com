"use client";

import { useState } from "react";
import {
  Layers,
  FilePlus,
  FolderPlus,
  FolderOpen,
  Search,
  CalendarDays,
  ChevronsDownUp,
  Trash2,
  X,
  Settings2,
  FileDiff,
  BarChart3,
  Command as CommandIcon,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { FileTree } from "@/components/explorer/FileTree";
import { RecycleBinPanel } from "@/components/trash/RecycleBinPanel";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { useTrashStore } from "@/store/trashStore";
import { useAuthStore } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useDialogStore } from "@/store/dialogStore";
import { useCreateAndRename } from "@/hooks/useCreateAndRename";
import { useNewNodeTargetParentId } from "@/hooks/useNewNodeTargetParentId";
import {
  importNativeDrop,
  setFolderCollapsed,
} from "@/services/fileOperations";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { openTodayDailyNote } from "@/services/dailyNotes";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceDropdown } from "@/components/workspace/WorkspaceDropdown";
import { cn } from "@/lib/utils";

// --------------------------------------------------------------------------
// Empty state for new / empty workspaces
// --------------------------------------------------------------------------

function EmptyWorkspace() {
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();
  return (
    <div className="animate-in fade-in flex h-full flex-col items-center justify-center gap-4 px-5 text-center duration-200">
      <div className="bg-primary/8 ring-primary/15 relative flex size-11 items-center justify-center rounded-xl shadow-xs ring-1">
        <Layers className="text-primary size-5" />
        <span className="ring-background absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2" />
      </div>
      <div>
        <p className="text-foreground text-xs font-semibold tracking-tight">
          No files yet
        </p>
        <p className="text-muted-foreground/75 mt-1 text-[11px] leading-relaxed">
          Create a folder or add a new file to get started.
        </p>
      </div>
      <div className="flex w-full max-w-[180px] flex-col gap-1.5">
        <button
          type="button"
          onClick={() => createFolderAndRename(null)}
          className="border-border/80 bg-muted/60 text-foreground hover:bg-accent focus-visible:ring-ring flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-100 hover:scale-[1.01] focus-visible:ring-1 focus-visible:outline-none active:scale-[0.98] cursor-pointer"
        >
          <FolderPlus className="text-primary size-3.5" />
          New Folder
        </button>
        <button
          type="button"
          onClick={() => createFileAndRename(null)}
          className="border-border/80 bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-100 hover:scale-[1.01] focus-visible:ring-1 focus-visible:outline-none active:scale-[0.98] cursor-pointer"
        >
          <FilePlus className="size-3.5" />
          New File
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Unified Modern Workspace Sidebar
// --------------------------------------------------------------------------

export function CollectionsSidebar() {
  const [showTrash, setShowTrash] = useState(false);
  const [search, setSearch] = useState("");

  const filterQuery = useWorkspaceStore((s) => s.filterQuery);
  const setFilterQuery = useWorkspaceStore((s) => s.setFilterQuery);
  const nodes = useWorkspaceStore((s) => s.nodes);

  const trashCount = useTrashStore((s) => s.entries.length);

  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();
  const targetParentId = useNewNodeTargetParentId();

  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setBottomPanelVisible = useUIStore((s) => s.setBottomPanelVisible);
  const setActiveBottomTab = useUIStore((s) => s.setActiveBottomTab);
  const openDialog = useDialogStore((s) => s.openDialog);

  const hasNodes = Object.values(nodes).some((n) => !n.deleted);

  return (
    <TooltipProvider>
      <div
        role="complementary"
        aria-label="Workspace Sidebar"
        className="flex h-full w-full flex-col select-none overflow-hidden"
        style={{ background: "var(--np-sidebar-bg)" }}
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
        {/* ── Top Bar: Workspace Switcher + Collapse Button ─────────────── */}
        <div
          className="flex h-10 shrink-0 items-center justify-between border-b px-2 gap-1.5"
          style={{ borderBottomColor: "var(--np-sidebar-border)" }}
        >
          <WorkspaceDropdown variant="sidebar" className="min-w-0 flex-1 text-xs" />
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => toggleSidebar()}
                aria-label="Collapse Sidebar (Ctrl+B)"
                className="text-muted-foreground/60 hover:text-foreground hover:bg-accent/50 flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors cursor-pointer"
              >
                <PanelLeftClose className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Collapse Sidebar (Ctrl+B)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Quick Navigation Bar (Linear / Notion Style) ─────────────── */}
        <div
          className="grid grid-cols-5 gap-0.5 border-b p-1 shrink-0"
          style={{ borderBottomColor: "var(--np-sidebar-border)" }}
        >
          <QuickNavButton
            icon={FilePlus}
            label="New File (Ctrl+N)"
            onClick={() => runAction("file.new")}
          />
          <QuickNavButton
            icon={CalendarDays}
            label="Today's Note"
            onClick={() =>
              void openTodayDailyNote().catch(() =>
                toast.error("Couldn't open today's daily note."),
              )
            }
          />
          <QuickNavButton
            icon={Search}
            label="Search in Files (Ctrl+Shift+F)"
            onClick={() => {
              setActiveBottomTab("search");
              setBottomPanelVisible(true);
            }}
          />
          <QuickNavButton
            icon={FolderOpen}
            label="Import Files (Ctrl+O)"
            onClick={() => runAction("file.open")}
          />
          <QuickNavButton
            icon={Trash2}
            label={showTrash ? "Back to Explorer" : `Recycle Bin (${trashCount})`}
            active={showTrash}
            badge={trashCount > 0 ? trashCount : undefined}
            onClick={() => setShowTrash((v) => !v)}
          />
        </div>

        {/* ── Section Title + Explorer Actions ─────────────────────────── */}
        <div
          className="flex h-8 shrink-0 items-center justify-between border-b px-2.5"
          style={{ borderBottomColor: "var(--np-sidebar-border)" }}
        >
          <span className="text-foreground/70 truncate text-[10px] font-bold tracking-wider uppercase">
            {showTrash ? "Recycle Bin" : "Files"}
          </span>

          {!showTrash && (
            <div className="flex items-center gap-0.5">
              <ToolbarButton
                icon={FilePlus}
                label="New File inside target"
                size="compact"
                onClick={() => createFileAndRename(targetParentId)}
              />
              <ToolbarButton
                icon={FolderPlus}
                label="New Folder"
                size="compact"
                onClick={() => createFolderAndRename(targetParentId)}
              />
              <ToolbarButton
                icon={ChevronsDownUp}
                label="Collapse All Folders"
                size="compact"
                onClick={() => {
                  for (const node of Object.values(nodes)) {
                    if (node.type === "folder")
                      setFolderCollapsed(node.id, true);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* ── Search / filter ─────────────────────────────────────────── */}
        {!showTrash && (
          <div
            className="relative flex h-8 shrink-0 items-center border-b px-2 py-1"
            style={{ borderBottomColor: "var(--np-sidebar-border)" }}
          >
            <div className="border-border/60 bg-background/70 focus-within:border-primary/40 focus-within:ring-primary/10 relative flex w-full items-center rounded-md border px-1.5 transition-all focus-within:ring-1">
              <Search className="text-muted-foreground/40 pointer-events-none size-3 shrink-0" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFilterQuery(e.target.value);
                }}
                placeholder="Filter files…"
                className="placeholder:text-muted-foreground/45 h-6 flex-1 border-none bg-transparent pr-4 pl-1.5 text-[11.5px] shadow-none focus-visible:ring-0"
                aria-label="Filter files"
              />
              {filterQuery && (
                <button
                  type="button"
                  aria-label="Clear filter"
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => {
                    setSearch("");
                    setFilterQuery("");
                  }}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Main Tree Content ────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {showTrash ? (
            <RecycleBinPanel />
          ) : hasNodes ? (
            <FileTree />
          ) : (
            <EmptyWorkspace />
          )}
        </div>

        {/* ── Bottom Dock: Quick Utilities ─────────────────────────────── */}
        <div
          className="flex h-8 shrink-0 items-center justify-between border-t px-2 text-muted-foreground"
          style={{ borderTopColor: "var(--np-sidebar-border)" }}
        >
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={FileDiff}
              label="Diff Checker"
              size="compact"
              onClick={() => runAction("tools.diffChecker")}
            />
            <ToolbarButton
              icon={BarChart3}
              label="Text Stats"
              size="compact"
              onClick={() => runAction("tools.textStats")}
            />
          </div>
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={CommandIcon}
              label="Command Palette (Ctrl+Shift+P)"
              size="compact"
              onClick={() => openDialog("commandPalette")}
            />
            <ToolbarButton
              icon={Settings2}
              label="Settings (Ctrl+,)"
              size="compact"
              onClick={() => openDialog("settings")}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function QuickNavButton({
  icon: Icon,
  label,
  onClick,
  active,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "relative flex h-7 items-center justify-center rounded-md transition-colors cursor-pointer outline-none",
            active
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/60",
          )}
        >
          <Icon className="size-3.5" />
          {badge !== undefined && (
            <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
              {badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// Minimal fallback export for any lingering references
export function IconNavRail() {
  return null;
}

export function PostmanSidebar() {
  return <CollectionsSidebar />;
}
