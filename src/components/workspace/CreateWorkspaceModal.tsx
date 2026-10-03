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

    const workspace = await createWorkspace(
      trimmedName,
      description.trim() || undefined,
    );
    if (workspace) {
      // A newly-created Drive workspace only contains internal metadata.
      useWorkspaceStore.getState().clearWorkspace();
      useTabsStore.getState().resetSession();
      setName("");
      setDescription("");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex size-8 items-center justify-center rounded-md">
              <FolderPlus className="text-primary size-4" />
            </div>
            <DialogTitle>Create Google Drive Workspace</DialogTitle>
          </div>
          <DialogDescription>
            Creating a workspace creates a new folder on Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="bg-muted/40 text-muted-foreground rounded-md border p-2.5 text-xs">
            <p className="text-foreground font-medium">
              Google Drive Integration
            </p>
            <p className="mt-0.5">
              Each workspace corresponds to a dedicated folder inside your
              Google Drive under{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-[11px]">
                NextNotePad.com/
              </code>
              .
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-name">
              Workspace / Folder Name{" "}
              <span className="text-destructive">*</span>
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
                if (e.key === "Enter" && !creatingWorkspace)
                  void handleCreate();
              }}
              maxLength={100}
              autoFocus
              disabled={creatingWorkspace}
              aria-describedby={nameError ? "workspace-name-error" : undefined}
            />
            {nameError && (
              <p id="workspace-name-error" className="text-destructive text-xs">
                {nameError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-description">
              Description{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
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
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={creatingWorkspace}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={creatingWorkspace || !name.trim()}
          >
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
