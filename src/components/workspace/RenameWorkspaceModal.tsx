"use client";

import { useState, useEffect } from "react";
import { Loader2, Pencil } from "lucide-react";
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

export function RenameWorkspaceModal() {
  const open = useMultiWorkspaceStore((s) => s.renameModalOpen);
  const targetId = useMultiWorkspaceStore((s) => s.targetWorkspaceId);
  const workspaces = useMultiWorkspaceStore((s) => s.workspaces);
  const setOpen = useMultiWorkspaceStore((s) => s.setRenameModalOpen);
  const renameWorkspace = useMultiWorkspaceStore((s) => s.renameWorkspace);
  const renaming = useMultiWorkspaceStore((s) => s.renamingWorkspace);

  const targetWorkspace = workspaces.find((w) => w.id === targetId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (targetWorkspace) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(targetWorkspace.name);
      setDescription(targetWorkspace.description ?? "");
      setNameError("");
    }
  }, [targetWorkspace]);

  function handleClose() {
    if (renaming) return;
    setOpen(false);
    setNameError("");
  }

  async function handleSave() {
    if (!targetId) return;
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

    await renameWorkspace(targetId, trimmedName, description.trim() || undefined);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
              <Pencil className="size-4 text-primary" />
            </div>
            <DialogTitle>Rename Workspace</DialogTitle>
          </div>
          <DialogDescription>
            Update the workspace name and description.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-workspace-name">
              Workspace Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rename-workspace-name"
              placeholder="e.g. My Workspace, Project Alpha…"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !renaming) void handleSave();
              }}
              maxLength={100}
              autoFocus
              disabled={renaming}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-workspace-description">
              Description <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="rename-workspace-description"
              placeholder="What is this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={renaming}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={renaming}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={renaming || !name.trim()}>
            {renaming ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
