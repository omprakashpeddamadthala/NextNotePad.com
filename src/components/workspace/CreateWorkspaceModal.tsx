"use client";

import { useState } from "react";
import { Loader2, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";

export function CreateWorkspaceModal() {
  const open = useMultiWorkspaceStore((s) => s.createModalOpen);
  const setOpen = useMultiWorkspaceStore((s) => s.setCreateModalOpen);
  const createWorkspace = useMultiWorkspaceStore((s) => s.createWorkspace);
  const creatingWorkspace = useMultiWorkspaceStore((s) => s.creatingWorkspace);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  function handleClose() {
    if (creatingWorkspace) return;
    setOpen(false);
    setName("");
    setDescription("");
    setNameError("");
  }

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Workspace name is required.");
      return;
    }
    if (trimmedName.length > 100) {
      setNameError("Name must be 100 characters or less.");
      return;
    }
    setNameError("");

    const workspace = await createWorkspace(trimmedName, description.trim() || undefined);
    if (workspace) {
      // After creating a new workspace, reload its (empty) file tree
      try {
        const data = await cloudRepo.fetchWorkspaceTree();
        useWorkspaceStore.getState().replaceAll(
          Object.fromEntries(data.nodes.map((n) => [n.id, n])),
        );
      } catch {
        useWorkspaceStore.getState().clearWorkspace();
      }
      useTabsStore.getState().resetSession();
      setName("");
      setDescription("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
              <FolderPlus className="size-4 text-primary" />
            </div>
            <DialogTitle>Create Google Drive Workspace</DialogTitle>
          </div>
          <DialogDescription>
            Creating a workspace creates a new folder on Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Google Drive Integration</p>
            <p className="mt-0.5">
              Each workspace corresponds to a dedicated folder inside your Google Drive under <code className="rounded bg-muted px-1 py-0.5 text-[11px]">NextNotePad.com/</code>.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-name">
              Workspace / Folder Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="workspace-name"
              placeholder="e.g. My Workspace, Project Alpha…"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creatingWorkspace) void handleCreate();
              }}
              maxLength={100}
              autoFocus
              disabled={creatingWorkspace}
              aria-describedby={nameError ? "workspace-name-error" : undefined}
            />
            {nameError && (
              <p id="workspace-name-error" className="text-xs text-destructive">
                {nameError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-description">
              Description <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="workspace-description"
              placeholder="What is this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={creatingWorkspace}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={creatingWorkspace}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={creatingWorkspace || !name.trim()}>
            {creatingWorkspace ? (
              <>
                <Loader2 className="animate-spin" />
                Creating…
              </>
            ) : (
              "Create Workspace"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
