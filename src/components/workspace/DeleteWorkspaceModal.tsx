"use client";

import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";

export function DeleteWorkspaceModal() {
  const open = useMultiWorkspaceStore((s) => s.deleteModalOpen);
  const targetId = useMultiWorkspaceStore((s) => s.targetWorkspaceId);
  const workspaces = useMultiWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useMultiWorkspaceStore((s) => s.activeWorkspaceId);
  const setOpen = useMultiWorkspaceStore((s) => s.setDeleteModalOpen);
  const deleteWorkspace = useMultiWorkspaceStore((s) => s.deleteWorkspace);
  const deleting = useMultiWorkspaceStore((s) => s.deletingWorkspace);

  const targetWorkspace = workspaces.find((w) => w.id === targetId);
  const isOnlyWorkspace = workspaces.length <= 1;

  function handleClose() {
    if (deleting) return;
    setOpen(false);
  }

  async function handleDelete() {
    if (!targetId || isOnlyWorkspace) return;
    const wasActive = activeWorkspaceId === targetId;

    const success = await deleteWorkspace(targetId);
    if (success && wasActive) {
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
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-destructive/10">
              <Trash2 className="size-4 text-destructive" />
            </div>
            <DialogTitle>Delete Workspace</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete workspace <strong className="text-foreground">"{targetWorkspace?.name}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          {isOnlyWorkspace ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cannot Delete Only Workspace</p>
                <p className="mt-0.5">
                  You must have at least one active workspace. Please create another workspace before deleting this one.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Warning</p>
                <p className="mt-0.5">
                  Deleting this workspace will delete all files inside it. This action cannot be undone.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting || isOnlyWorkspace}
          >
            {deleting ? (
              <>
                <Loader2 className="animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete Workspace"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
