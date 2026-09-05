"use client";

import { useEffect } from "react";
import { Check, ChevronDown, Plus, Loader2, Layers, LogIn, Pencil, Trash2 } from "lucide-react";
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

export function WorkspaceDropdown({ variant = "default", className }: WorkspaceDropdownProps) {
  const status = useAuthStore((s) => s.status);
  const workspaces = useMultiWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useMultiWorkspaceStore((s) => s.activeWorkspaceId);
  const loadingWorkspaces = useMultiWorkspaceStore((s) => s.loadingWorkspaces);
  const switchingWorkspace = useMultiWorkspaceStore((s) => s.switchingWorkspace);
  const loadWorkspaces = useMultiWorkspaceStore((s) => s.loadWorkspaces);
  const switchWorkspace = useMultiWorkspaceStore((s) => s.switchWorkspace);
  const setCreateModalOpen = useMultiWorkspaceStore((s) => s.setCreateModalOpen);
  const setRenameModalOpen = useMultiWorkspaceStore((s) => s.setRenameModalOpen);
  const setDeleteModalOpen = useMultiWorkspaceStore((s) => s.setDeleteModalOpen);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Load workspaces when authenticated
  useEffect(() => {
    if (status === "authenticated" && workspaces.length === 0 && !loadingWorkspaces) {
      void loadWorkspaces();
    }
  }, [status, workspaces.length, loadingWorkspaces, loadWorkspaces]);

  async function handleSwitch(id: string) {
    if (id === activeWorkspaceId || switchingWorkspace) return;
    await switchWorkspace(id);

    // Reload the workspace file tree for the newly active workspace
    try {
      const data = await cloudRepo.fetchWorkspaceTree();
      useWorkspaceStore.getState().replaceAll(
        Object.fromEntries(data.nodes.map((n) => [n.id, n])),
      );
    } catch {
      useWorkspaceStore.getState().clearWorkspace();
    }
    useTabsStore.getState().resetSession();
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
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
            "flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
            variant === "toolbar" && "h-7 border border-input bg-background/80 px-2 shadow-xs hover:bg-accent hover:text-accent-foreground",
            variant === "sidebar" && "px-1 py-0.5 font-semibold text-muted-foreground uppercase tracking-wider",
            className,
          )}
          aria-label="Workspace: Guest Mode"
        >
          <Layers className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="max-w-[130px] truncate">
            {variant === "sidebar" ? "Guest Workspace" : "Workspace"}
          </span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Google Drive Workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-2 text-xs text-muted-foreground">
            Sign in with Google to create & sync workspaces as folders on Google Drive.
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              window.location.assign("/api/auth/google");
            }}
            className="gap-2 text-xs font-medium text-primary cursor-pointer"
          >
            <LogIn className="size-3.5 text-primary" />
            Sign in with Google Drive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const displayName = activeWorkspace?.name ?? (loadingWorkspaces ? "Loading…" : "My Workspace");

  const triggerClasses = cn(
    "flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium outline-none transition-colors hover:bg-[var(--np-menu-hover)] focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    variant === "toolbar" && "h-7 border border-input bg-background/80 px-2.5 shadow-xs hover:bg-accent hover:text-accent-foreground",
    variant === "sidebar" && "min-w-0 max-w-full px-1 py-0.5 font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground",
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
        <Layers className="size-3.5 shrink-0 text-primary" />
        <span className="max-w-[140px] truncate">{displayName}</span>
        {switchingWorkspace || loadingWorkspaces ? (
          <Loader2 className="size-3 animate-spin text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="uppercase tracking-wider font-semibold">Google Drive Workspaces</span>
          <p className="mt-0.5 text-[10px] normal-case text-muted-foreground/80">
            Workspaces create dedicated folders on Google Drive.
          </p>
        </div>
        <DropdownMenuSeparator />

        {loadingWorkspaces ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">No workspaces found.</div>
        ) : (
          workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              onSelect={() => void handleSwitch(w.id)}
              className="group flex items-center gap-2 cursor-pointer pr-1"
              aria-current={w.id === activeWorkspaceId ? "true" : undefined}
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {w.id === activeWorkspaceId && <Check className="size-3.5 text-primary" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium flex items-center gap-1.5">
                  <span>{w.name}</span>
                </div>
                {w.description ? (
                  <div className="truncate text-[11px] text-muted-foreground">{w.description}</div>
                ) : (
                  <div className="truncate text-[10px] text-muted-foreground/70">Google Drive Folder</div>
                )}
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 shrink-0">
                <button
                  type="button"
                  title="Rename workspace"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setRenameModalOpen(true, w.id);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  title={workspaces.length <= 1 ? "Cannot delete your only workspace" : "Delete workspace"}
                  disabled={workspaces.length <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDeleteModalOpen(true, w.id);
                  }}
                  className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
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
          className="gap-2 text-xs font-medium cursor-pointer"
          id="create-new-workspace-btn"
        >
          <Plus className="size-3.5 text-primary" />
          Create New Workspace (Drive Folder)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

