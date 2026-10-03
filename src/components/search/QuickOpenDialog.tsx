"use client";

import { useMemo, useEffect, useState } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { getFileIcon } from "@/lib/fileIcons";
import { useDialogStore } from "@/store/dialogStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useTabsStore } from "@/store/tabsStore";
import { useAuthStore } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import {
  loadDriveFileIndex,
  prefetchFileContents,
} from "@/services/storage/driveDataClient";
import { toast } from "sonner";
import { FolderGit2 } from "lucide-react";
import type { FileNode } from "@/types/file";

export interface SearchableFile {
  id: string;
  name: string;
  path: string;
  size?: number;
  version?: number;
  workspaceId?: string;
  workspaceName?: string;
}

export function QuickOpenDialog() {
  const open = useDialogStore((s) => s.open.quickOpen);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);
  const setOpen = (v: boolean) => setDialogOpen("quickOpen", v);

  const nodes = useWorkspaceStore((s) => s.nodes);
  const recent = useRecentFilesStore((s) => s.recent);
  const addRecent = useRecentFilesStore((s) => s.addRecent);
  const openTab = useTabsStore((s) => s.openTab);

  const status = useAuthStore((s) => s.status);
  const activeWorkspaceId = useMultiWorkspaceStore((s) => s.activeWorkspaceId);
  const switchWorkspace = useMultiWorkspaceStore((s) => s.switchWorkspace);
  const workspaces = useMultiWorkspaceStore((s) => s.workspaces);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const [cloudFiles, setCloudFiles] = useState<SearchableFile[]>([]);

  // Fetch all files across all user workspaces when dialog opens in authenticated mode
  useEffect(() => {
    if (!open || status !== "authenticated") return;
    let cancelled = false;

    void (async () => {
      try {
        const files = await loadDriveFileIndex({
          onFresh: (fresh) => {
            if (!cancelled) setCloudFiles(fresh);
          },
        });
        if (!cancelled) {
          setCloudFiles(files);
          const recentIds = new Set(
            recent.slice(0, 8).map((item) => item.fileId),
          );
          void prefetchFileContents(
            files
              .filter((file) => recentIds.has(file.id))
              .map((file) => ({
                id: file.id,
                version: file.version,
                size: file.size,
              })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch cross-workspace files:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, status, recent]);

  // Combine and sort files
  const files = useMemo(() => {
    const recentOrder = new Map(recent.map((r, i) => [r.fileId, i]));

    if (status === "authenticated" && cloudFiles.length > 0) {
      // De-duplicate by id, prioritizing latest
      const fileMap = new Map<string, SearchableFile>();
      for (const cf of cloudFiles) {
        fileMap.set(cf.id, cf);
      }
      // Also ensure any local unsaved/just created nodes in active workspace are present
      for (const n of Object.values(nodes)) {
        if (n.type === "file" && !n.deleted && !fileMap.has(n.id)) {
          fileMap.set(n.id, {
            id: n.id,
            name: n.name,
            path: n.path,
            workspaceId: activeWorkspaceId || undefined,
            workspaceName: activeWorkspace?.name || "Active Workspace",
          });
        }
      }

      return Array.from(fileMap.values()).sort((a, b) => {
        const ra = recentOrder.get(a.id) ?? Infinity;
        const rb = recentOrder.get(b.id) ?? Infinity;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      });
    }

    // Guest mode: local workspace nodes
    const localFiles: SearchableFile[] = Object.values(nodes)
      .filter((n): n is FileNode => n.type === "file" && !n.deleted)
      .map((n) => ({
        id: n.id,
        name: n.name,
        path: n.path,
        workspaceName: "Local Workspace",
      }));

    return localFiles.sort((a, b) => {
      const ra = recentOrder.get(a.id) ?? Infinity;
      const rb = recentOrder.get(b.id) ?? Infinity;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [cloudFiles, nodes, recent, status, activeWorkspaceId, activeWorkspace]);

  async function handleSelect(file: SearchableFile) {
    setOpen(false);

    // If file is from a different workspace, switch workspace first
    if (
      file.workspaceId &&
      activeWorkspaceId &&
      file.workspaceId !== activeWorkspaceId
    ) {
      const toastId = toast.loading(`Switching to "${file.workspaceName}"...`);
      try {
        const treePromise = cloudRepo.fetchWorkspaceTree(file.workspaceId, {
          onFresh: (fresh) => {
            if (
              useMultiWorkspaceStore.getState().activeWorkspaceId ===
              fresh.workspaceId
            ) {
              useWorkspaceStore
                .getState()
                .replaceAll(
                  Object.fromEntries(
                    fresh.nodes.map((node) => [node.id, node]),
                  ),
                );
            }
          },
        });
        void treePromise.catch(() => undefined);
        const switched = await switchWorkspace(file.workspaceId);
        if (!switched) {
          toast.error(`Could not switch workspace: ${file.workspaceName}`, {
            id: toastId,
          });
          return;
        }
        useWorkspaceStore.getState().clearWorkspace();
        useTabsStore.getState().resetSession();
        const data = await treePromise;
        useWorkspaceStore
          .getState()
          .replaceAll(Object.fromEntries(data.nodes.map((n) => [n.id, n])));
        openTab(file.id);
        addRecent(file.id);
        toast.success(`Opened ${file.name} in "${file.workspaceName}"`, {
          id: toastId,
        });
      } catch (err) {
        console.error("Error opening cross-workspace file:", err);
        toast.error(`Could not switch workspace: ${file.workspaceName}`, {
          id: toastId,
        });
      }
      return;
    }

    // Same workspace or guest
    openTab(file.id);
    addRecent(file.id);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Quick Open — Search Files"
      description="Search and open files across all your workspaces"
    >
      <CommandInput placeholder="Search files across all workspaces… (e.g. env, .ts, README)" />
      <CommandList>
        <CommandEmpty>No files found matching your search.</CommandEmpty>
        <CommandGroup heading="Files across all workspaces">
          {files.map((file) => {
            const Icon = getFileIcon(file.name);
            const isAnotherWorkspace =
              file.workspaceId &&
              activeWorkspaceId &&
              file.workspaceId !== activeWorkspaceId;

            return (
              <CommandItem
                key={`${file.workspaceId || "ws"}-${file.id}`}
                value={`${file.name} ${file.path} ${file.workspaceName || ""}`}
                onSelect={() => void handleSelect(file)}
                className="flex cursor-pointer items-center gap-2.5 py-2"
              >
                <Icon className="size-4 shrink-0" />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-foreground truncate text-xs font-medium">
                    {file.name}
                  </span>
                  {file.workspaceName && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                        isAnotherWorkspace
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-500"
                          : "bg-muted/70 text-muted-foreground border-border/40 border"
                      }`}
                      title={`Workspace: ${file.workspaceName}`}
                    >
                      <FolderGit2 className="size-2.5 opacity-70" />
                      <span className="max-w-[120px] truncate">
                        {file.workspaceName}
                      </span>
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground/60 ml-auto max-w-[160px] truncate text-[11px]">
                  {file.path}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
