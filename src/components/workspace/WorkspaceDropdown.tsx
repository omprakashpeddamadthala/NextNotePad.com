"use client";

import { useEffect } from "react";
import {
  Check,
  ChevronDown,
  Plus,
  Loader2,
  Layers,
  LogIn,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useAuthStore } from "@/store/authStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import { cn } from "@/lib/utils";

interface WorkspaceDropdownProps {
  variant?: "menubar" | "toolbar" | "sidebar" | "default";
  className?: string;
}

export function WorkspaceDropdown({
  variant = "default",
  className,
}: WorkspaceDropdownProps) {
  const status = useAuthStore((s) => s.status);
  const workspaces = useMultiWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useMultiWorkspaceStore((s) => s.activeWorkspaceId);
  const loadingWorkspaces = useMultiWorkspaceStore((s) => s.loadingWorkspaces);
  const switchingWorkspace = useMultiWorkspaceStore(
    (s) => s.switchingWorkspace,
  );
  const loadWorkspaces = useMultiWorkspaceStore((s) => s.loadWorkspaces);
  const switchWorkspace = useMultiWorkspaceStore((s) => s.switchWorkspace);
  const setCreateModalOpen = useMultiWorkspaceStore(
    (s) => s.setCreateModalOpen,
  );
  const setRenameModalOpen = useMultiWorkspaceStore(
    (s) => s.setRenameModalOpen,
  );
  const setDeleteModalOpen = useMultiWorkspaceStore(
    (s) => s.setDeleteModalOpen,
  );

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Load workspaces when authenticated
  useEffect(() => {
    if (
      status === "authenticated" &&
      workspaces.length === 0 &&
      !loadingWorkspaces
    ) {
      void loadWorkspaces();
    }
  }, [status, workspaces.length, loadingWorkspaces, loadWorkspaces]);

  async function handleSwitch(id: string) {
    if (id === activeWorkspaceId || switchingWorkspace) return;
    await switchWorkspace(id);

    // Reload the workspace file tree for the newly active workspace
    try {
      const data = await cloudRepo.fetchWorkspaceTree();
      useWorkspaceStore
        .getState()
        .replaceAll(Object.fromEntries(data.nodes.map((n) => [n.id, n])));
    } catch {
      useWorkspaceStore.getState().clearWorkspace();
    }
    useTabsStore.getState().resetSession();
  }

  if (status === "loading") {
    return (
      <div className="text-muted-foreground flex items-center gap-1.5 px-2 py-1 text-xs">
        <Loader2 className="size-3 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  // Guest mode handling
  if (status === "guest") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "border-border/70 bg-background/70 hover:border-primary/25 hover:bg-accent focus-visible:ring-ring/30 flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 outline-none focus-visible:ring-2",
            variant === "toolbar" &&
              "border-input bg-background/80 hover:bg-accent hover:text-accent-foreground h-7 border px-2 shadow-xs",
            variant === "sidebar" &&
              "text-muted-foreground px-1 py-0.5 font-semibold tracking-wider uppercase",
            className,
          )}
          aria-label="Workspace: Guest Mode"
        >
          <Layers className="text-primary/80 size-3.5 shrink-0" />
          <span className="max-w-[130px] truncate">
            {variant === "sidebar" ? "Guest Workspace" : "Workspace"}
          </span>
          <ChevronDown className="text-muted-foreground size-3 shrink-0 opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Google Drive Workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="text-muted-foreground px-2 py-2 text-xs">
            Sign in with Google to create & sync workspaces as folders on Google
            Drive.
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              // Full-page navigation required for OAuth 302 endpoint
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/api/auth/google");
            }}
            className="text-primary cursor-pointer gap-2 text-xs font-medium"
          >
            <LogIn className="text-primary size-3.5" />
            Sign in with Google Drive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const displayName =
    activeWorkspace?.name ?? (loadingWorkspaces ? "Loading…" : "My Workspace");

  const triggerClasses = cn(
    "flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-2.5 text-xs font-semibold outline-none shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 hover:border-primary/25 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
    variant === "toolbar" &&
      "h-7 border border-input bg-background/80 px-2.5 shadow-xs hover:bg-accent hover:text-accent-foreground",
    variant === "sidebar" &&
      "min-w-0 max-w-full px-1 py-0.5 font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground",
    className,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={triggerClasses}
        disabled={loadingWorkspaces || switchingWorkspace}
        aria-label={`Current workspace: ${displayName}`}
        title={`Active Workspace: ${displayName} (Synced with Google Drive)`}
      >
        <Layers className="text-primary size-3.5 shrink-0" />
        <span className="max-w-[140px] truncate">{displayName}</span>
        {switchingWorkspace || loadingWorkspaces ? (
          <Loader2 className="text-muted-foreground size-3 shrink-0 animate-spin" />
        ) : (
          <ChevronDown className="text-muted-foreground size-3 shrink-0" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <div className="text-muted-foreground px-2 py-1.5 text-[11px] font-medium">
          <span className="font-semibold tracking-wider uppercase">
            Google Drive Workspaces
          </span>
          <p className="text-muted-foreground/80 mt-0.5 text-[10px] normal-case">
            Workspaces create dedicated folders on Google Drive.
          </p>
        </div>
        <DropdownMenuSeparator />

        {loadingWorkspaces ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-muted-foreground px-2 py-2 text-xs">
            No workspaces found.
          </div>
        ) : (
          workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              onSelect={() => void handleSwitch(w.id)}
              className="group flex cursor-pointer items-center gap-2 pr-1"
              aria-current={w.id === activeWorkspaceId ? "true" : undefined}
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {w.id === activeWorkspaceId && (
                  <Check className="text-primary size-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-xs font-medium">
                  <span>{w.name}</span>
                </div>
                {w.description ? (
                  <div className="text-muted-foreground truncate text-[11px]">
                    {w.description}
                  </div>
                ) : (
                  <div className="text-muted-foreground/70 truncate text-[10px]">
                    Google Drive Folder
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title="Rename workspace"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setRenameModalOpen(true, w.id);
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  title={
                    workspaces.length <= 1
                      ? "Cannot delete your only workspace"
                      : "Delete workspace"
                  }
                  disabled={workspaces.length <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDeleteModalOpen(true, w.id);
                  }}
                  className="text-muted-foreground hover:text-destructive hover:bg-muted rounded p-1 disabled:pointer-events-none disabled:opacity-30"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => setCreateModalOpen(true)}
          className="cursor-pointer gap-2 text-xs font-medium"
          id="create-new-workspace-btn"
        >
          <Plus className="text-primary size-3.5" />
          Create New Workspace (Drive Folder)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
