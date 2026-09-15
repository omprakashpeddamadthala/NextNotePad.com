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
import {
  importNativeDrop,
  setFolderCollapsed,
} from "@/services/fileOperations";
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
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-[color,background-color,box-shadow,transform] duration-150 ease-out outline-none",
            "hover:bg-accent hover:text-foreground active:scale-[0.94]",
            "focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:outline-none",
            active
              ? "text-primary bg-primary/12 ring-primary/20 before:bg-primary shadow-xs ring-1 before:absolute before:top-1/2 before:-left-1.5 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r-full"
              : "text-muted-foreground/80",
          )}
        >
          <Icon className="size-4 transition-transform duration-150" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs font-medium">
        {label}
      </TooltipContent>
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
        className="np-scrollbar np-panel-surface flex w-11 shrink-0 flex-col items-center gap-1.5 overflow-x-hidden overflow-y-auto border-r py-3 select-none"
        style={{ borderRightColor: "var(--np-tab-border)" }}
      >
        <NavRailIconButton
          icon={Layers}
          label="Files & Collections"
          active={sidebarVisible}
          onClick={() => toggleSidebar()}
        />

        <Separator className="my-1.5 w-4 opacity-30" />

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
    <div className="animate-in fade-in flex h-full flex-col items-center justify-center gap-4 px-6 text-center duration-200">
      <div className="bg-primary/10 ring-primary/20 relative flex size-12 items-center justify-center rounded-2xl shadow-xs ring-1">
        <Layers className="text-primary size-5" />
        <span className="ring-background absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2" />
      </div>
      <div>
        <p className="text-foreground text-xs font-semibold tracking-tight">
          No files in workspace
        </p>
        <p className="text-muted-foreground/80 mt-1 text-[11px] leading-relaxed">
          Create a collection folder or add a new file to get started.
        </p>
      </div>
      <div className="flex w-full max-w-[200px] flex-col gap-2">
        <button
          type="button"
          onClick={() => createFolderAndRename(null)}
          className="border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:border-primary/40 focus-visible:ring-ring flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:scale-[1.02] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98]"
        >
          <FolderPlus className="text-primary size-3.5" />
          New Collection
        </button>
        <button
          type="button"
          onClick={() => createFileAndRename(null)}
          className="border-border/80 bg-background/60 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:scale-[1.02] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98]"
        >
          <FilePlus className="size-3.5" />
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

  const trashCount = useTrashStore((s) => s.entries.length);

  const authStatus = useAuthStore((s) => s.status);
  const activeWorkspace = useMultiWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId),
  );

  const workspaceName =
    authStatus === "authenticated"
      ? (activeWorkspace?.name ?? "My Workspace")
      : "Guest Workspace";

  const hasNodes = Object.values(nodes).some((n) => !n.deleted);

  return (
    <div
      role="complementary"
      aria-label="File Explorer"
      className="np-panel-surface flex h-full flex-col select-none"
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
        className="bg-background/45 flex h-11 shrink-0 items-center justify-between border-b px-3"
        style={{ borderBottomColor: "var(--np-tab-border)" }}
      >
        <div className="min-w-0 flex-1 leading-tight">
          <span className="text-foreground/75 block truncate text-[11px] font-semibold tracking-[0.11em] uppercase">
            {showTrash ? "Recycle Bin" : "Files"}
          </span>
          {!showTrash && (
            <span className="text-muted-foreground/70 mt-0.5 block truncate text-[10px]">
              {workspaceName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {!showTrash && (
            <>
              <ToolbarButton
                icon={ChevronsDownUp}
                label="Collapse All"
                size="compact"
                onClick={() => {
                  for (const node of Object.values(nodes)) {
                    if (node.type === "folder")
                      setFolderCollapsed(node.id, true);
                  }
                }}
              />
            </>
          )}
          <ToolbarButton
            icon={Trash2}
            label={
              showTrash ? "Back to Explorer" : `Recycle Bin (${trashCount})`
            }
            active={showTrash}
            size="compact"
            onClick={() => setShowTrash((v) => !v)}
          />
        </div>
      </div>

      {/* ── Search / filter ───────────────────────────────────────────── */}
      {!showTrash && (
        <div
          className="relative flex h-11 shrink-0 items-center border-b px-2.5 py-1.5"
          style={{ borderBottomColor: "var(--np-tab-border)" }}
        >
          <div className="border-border/70 bg-background/75 focus-within:border-primary/40 focus-within:bg-background focus-within:ring-primary/15 relative flex w-full items-center rounded-lg border px-2 shadow-xs transition-all focus-within:ring-2">
            <Search className="text-muted-foreground/50 pointer-events-none size-3 shrink-0" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFilterQuery(e.target.value);
              }}
              placeholder="Filter files…"
              className="placeholder:text-muted-foreground/55 h-7 flex-1 border-none bg-transparent pr-4 pl-1.5 text-xs shadow-none focus-visible:ring-0"
              aria-label="Search collections"
            />
            {filterQuery && (
              <button
                type="button"
                aria-label="Clear search"
                className="text-muted-foreground hover:text-foreground transition-colors"
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

      {/* ── Section label ─────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-1">
          <span className="text-muted-foreground/70 text-[10px] font-semibold tracking-[0.11em] uppercase select-none">
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
