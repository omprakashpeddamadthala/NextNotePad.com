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
  Command as CommandIcon,
  Braces,
  Eye,
  CalendarDays,
  FileDiff,
  FolderPlus,
  ChevronsDownUp,
  Trash2,
  EyeOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { FileTree } from "@/components/explorer/FileTree";
import { RecycleBinPanel } from "@/components/trash/RecycleBinPanel";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { useDialogStore } from "@/store/dialogStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTabsStore } from "@/store/tabsStore";
import { useTrashStore } from "@/store/trashStore";
import { useAuthStore } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useCreateAndRename } from "@/hooks/useCreateAndRename";
import { importNativeDrop, setFolderCollapsed } from "@/services/fileOperations";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { VoiceDictationButton } from "@/components/editor/VoiceDictationButton";
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
            "flex size-8 items-center justify-center rounded-md transition-colors shrink-0",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function IconNavRail({
  activeNav,
  onNavChange,
}: {
  activeNav?: string;
  onNavChange?: (id: string) => void;
}) {
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const bottomPanelVisible = useUIStore((s) => s.bottomPanelVisible);
  const setBottomPanelVisible = useUIStore((s) => s.setBottomPanelVisible);
  const openDialog = useDialogStore((s) => s.openDialog);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <TooltipProvider>
      <nav
        aria-label="Left navigation rail"
        className="np-scrollbar flex w-10 shrink-0 flex-col items-center gap-1 border-r bg-background py-2 overflow-y-auto overflow-x-hidden"
      >
        <NavRailIconButton
          icon={Layers}
          label="Files & Collections"
          active={sidebarVisible}
          onClick={() => toggleSidebar()}
        />

        <Separator className="my-1 w-6" />

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

        <Separator className="my-1 w-6" />

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

        <Separator className="my-1 w-6" />

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

        <Separator className="my-1 w-6" />

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

        <Separator className="my-1 w-6" />

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

// --------------------------------------------------------------------------
// Empty state for new / empty workspaces
// --------------------------------------------------------------------------

function EmptyWorkspace() {
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Layers className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs font-medium text-foreground">No files yet</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Create your first collection or import an existing one.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => createFolderAndRename(null)}
          className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
        >
          <FolderPlus className="size-3.5" />
          New Collection
        </button>
        <button
          type="button"
          onClick={() => createFileAndRename(null)}
          className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
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

  const showHiddenFiles = useUIStore((s) => s.showHiddenFiles);
  const toggleShowHiddenFiles = useUIStore((s) => s.toggleShowHiddenFiles);
  const trashCount = useTrashStore((s) => s.entries.length);
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();

  const authStatus = useAuthStore((s) => s.status);
  const activeWorkspace = useMultiWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId),
  );

  const workspaceName =
    authStatus === "authenticated" ? (activeWorkspace?.name ?? "My Workspace") : "Explorer";

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
      {/* ── Header: workspace name + action buttons ───────────────────── */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b px-2">
        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {showTrash ? "Recycle Bin" : "Files"}
        </span>

        <div className="flex items-center gap-0.5">
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
        <div className="relative flex h-8 shrink-0 items-center border-b px-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilterQuery(e.target.value);
            }}
            placeholder="Search…"
            className="h-6 text-xs"
            aria-label="Search collections"
          />
          {filterQuery && (
            <button
              type="button"
              aria-label="Clear search"
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

      {/* ── Section label ─────────────────────────────────────────────── */}
      {!showTrash && (
        <div className="flex shrink-0 items-center justify-between px-2 pt-1.5 pb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
  const [activeNav, setActiveNav] = useState("collections");

  return (
    <div className="flex h-full">
      <IconNavRail activeNav={activeNav} onNavChange={setActiveNav} />
      <CollectionsSidebar />
    </div>
  );
}
