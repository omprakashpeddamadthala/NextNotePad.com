import { useState } from "react";
import {
  Layers,
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Search,
  Replace,
  ZoomIn,
  ZoomOut,
  PanelLeft,
  WrapText,
  PanelBottom,
  CalendarDays,
  FolderPlus,
  ChevronsDownUp,
  Trash2,
  EyeOff,
  Eye,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { FileTree } from "@/components/explorer/FileTree";
import { RecycleBinPanel } from "@/components/trash/RecycleBinPanel";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTrashStore } from "@/store/trashStore";
import { useAuthStore } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useCreateAndRename } from "@/hooks/useCreateAndRename";
import { importNativeDrop, setFolderCollapsed } from "@/services/fileOperations";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { openTodayDailyNote } from "@/services/dailyNotes";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// --------------------------------------------------------------------------
// Shared icon button — used in both left and right nav rails
// --------------------------------------------------------------------------

function NavRailIconButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "relative flex size-9 items-center justify-center rounded-md transition-all duration-150 shrink-0 outline-none",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active
              ? "text-primary bg-primary/10 before:absolute before:left-0 before:top-1/2 before:h-5 before:-translate-y-1/2 before:w-0.5 before:rounded-r-full before:bg-primary"
              : "text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

// --------------------------------------------------------------------------
// Left icon nav rail
// --------------------------------------------------------------------------

export function IconNavRail() {
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const bottomPanelVisible = useUIStore((s) => s.bottomPanelVisible);
  const setBottomPanelVisible = useUIStore((s) => s.setBottomPanelVisible);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <TooltipProvider>
      <nav
        aria-label="Left navigation rail"
        className="np-scrollbar flex w-11 shrink-0 flex-col items-center gap-0.5 border-r bg-[var(--np-toolbar-bg)] py-2 overflow-y-auto overflow-x-hidden"
        style={{ borderRightColor: "var(--np-tab-border)" }}
      >
        <NavRailIconButton
          icon={Layers}
          label="Files & Collections"
          active={sidebarVisible}
          onClick={() => toggleSidebar()}
        />

        <Separator className="my-1 w-5 opacity-40" />

        <NavRailIconButton
          icon={FilePlus}
          label="New File (Ctrl+N)"
          onClick={() => runAction("file.new")}
        />
        <NavRailIconButton
          icon={FolderOpen}
          label="Open / Import (Ctrl+O)"
          onClick={() => runAction("file.open")}
        />
        <NavRailIconButton
          icon={Save}
          label="Save (Ctrl+S)"
          onClick={() => runAction("file.save")}
        />
        <NavRailIconButton
          icon={CalendarDays}
          label="Today's Daily Note"
          onClick={() =>
            void openTodayDailyNote().catch(() =>
              toast.error("Couldn't open today's daily note."),
            )
          }
        />

        <Separator className="my-1 w-5 opacity-40" />

        <NavRailIconButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          onClick={() => runAction("edit.undo")}
        />
        <NavRailIconButton
          icon={Redo2}
          label="Redo (Ctrl+Y)"
          onClick={() => runAction("edit.redo")}
        />

        <Separator className="my-1 w-5 opacity-40" />

        <NavRailIconButton
          icon={Search}
          label="Find (Ctrl+F)"
          onClick={() => runAction("search.find")}
        />
        <NavRailIconButton
          icon={Replace}
          label="Replace (Ctrl+H)"
          onClick={() => runAction("search.replace")}
        />

        <Separator className="my-1 w-5 opacity-40" />

        <NavRailIconButton
          icon={ZoomOut}
          label="Zoom Out"
          onClick={() => runAction("view.zoomOut")}
        />
        <NavRailIconButton
          icon={ZoomIn}
          label="Zoom In"
          onClick={() => runAction("view.zoomIn")}
        />
        <NavRailIconButton
          icon={WrapText}
          label="Toggle Word Wrap"
          active={settings.wordWrap}
          onClick={() => updateSettings({ wordWrap: !settings.wordWrap })}
        />

        <Separator className="my-1 w-5 opacity-40" />

        <NavRailIconButton
          icon={PanelLeft}
          label="Toggle File Explorer"
          active={sidebarVisible}
          onClick={() => toggleSidebar()}
        />
        <NavRailIconButton
          icon={PanelBottom}
          label="Toggle Bottom Panel"
          active={bottomPanelVisible}
          onClick={() => setBottomPanelVisible(!bottomPanelVisible)}
        />
      </nav>
    </TooltipProvider>
  );
}

// --------------------------------------------------------------------------
// Empty state for new / empty workspaces
// --------------------------------------------------------------------------

function EmptyWorkspace() {
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <Layers className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">No files yet</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Create a collection or import an existing file to get started.
        </p>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        <button
          type="button"
          onClick={() => createFolderAndRename(null)}
          className="flex items-center justify-center gap-2 rounded-md border bg-background/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FolderPlus className="size-3.5 text-primary" />
          New Collection
        </button>
        <button
          type="button"
          onClick={() => createFileAndRename(null)}
          className="flex items-center justify-center gap-2 rounded-md border bg-background/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FilePlus className="size-3.5 text-muted-foreground" />
          New File
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Collections sidebar panel — exported so AppShell can put it in a ResizablePanel
// --------------------------------------------------------------------------

export function CollectionsSidebar() {
  const [showTrash, setShowTrash] = useState(false);
  const [search, setSearch] = useState("");

  const filterQuery = useWorkspaceStore((s) => s.filterQuery);
  const setFilterQuery = useWorkspaceStore((s) => s.setFilterQuery);
  const nodes = useWorkspaceStore((s) => s.nodes);

  const showHiddenFiles = useUIStore((s) => s.showHiddenFiles);
  const toggleShowHiddenFiles = useUIStore((s) => s.toggleShowHiddenFiles);
  const trashCount = useTrashStore((s) => s.entries.length);
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();

  const authStatus = useAuthStore((s) => s.status);
  const activeWorkspace = useMultiWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId),
  );

  // workspaceName is available for future use / display in the header
  void (authStatus === "authenticated" ? (activeWorkspace?.name ?? "My Workspace") : "Explorer");

  const hasNodes = Object.values(nodes).some((n) => !n.deleted);

  return (
    <div
      role="complementary"
      aria-label="File Explorer"
      className="flex h-full flex-col bg-background"
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
      {/* ── Header: section title + action buttons ────────────────────── */}
      <div
        className="flex h-9 shrink-0 items-center justify-between border-b px-2.5"
        style={{ borderBottomColor: "var(--np-tab-border)" }}
      >
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 select-none">
          {showTrash ? "Recycle Bin" : "Files"}
        </span>

        <div className="flex items-center gap-0">
          {!showTrash && (
            <>
              <ToolbarButton
                icon={FilePlus}
                label="New File"
                onClick={() => createFileAndRename(null)}
                size="compact"
              />
              <ToolbarButton
                icon={FolderPlus}
                label="New Folder"
                onClick={() => createFolderAndRename(null)}
                size="compact"
              />
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
              <ToolbarButton
                icon={showHiddenFiles ? EyeOff : Eye}
                label={showHiddenFiles ? "Hide Hidden Items" : "Show Hidden Items"}
                active={showHiddenFiles}
                size="compact"
                onClick={toggleShowHiddenFiles}
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
      </div>

      {/* ── Search / filter ───────────────────────────────────────────── */}
      {!showTrash && (
        <div
          className="relative flex h-8 shrink-0 items-center border-b px-2"
          style={{ borderBottomColor: "var(--np-tab-border)" }}
        >
          <Search className="pointer-events-none absolute left-4 size-3 text-muted-foreground/40" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilterQuery(e.target.value);
            }}
            placeholder="Filter files…"
            className="h-6 pl-6 text-[11px] bg-transparent border-none shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
            aria-label="Search collections"
          />
          {filterQuery && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setSearch("");
                setFilterQuery("");
              }}
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Section label ─────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex shrink-0 items-center justify-between px-2.5 pt-2 pb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
            Collections
          </span>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {showTrash ? (
          <RecycleBinPanel />
        ) : hasNodes ? (
          <FileTree />
        ) : (
          <EmptyWorkspace />
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// PostmanSidebar — used only on mobile / if you want the composed version
// --------------------------------------------------------------------------

export function PostmanSidebar() {
  return (
    <div className="flex h-full">
      <IconNavRail />
      <CollectionsSidebar />
    </div>
  );
}
