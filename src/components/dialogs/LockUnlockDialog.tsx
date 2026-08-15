"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
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
import { useLockDialogStore } from "@/store/lockDialogStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { lockNode, unlockNode } from "@/services/fileLock";
import type { WorkspaceNode } from "@/types/file";

const MIN_PASSPHRASE_LENGTH = 4;

/** Owns the form's local state, keyed by `${targetId}-${mode}` in the parent so opening the
 *  dialog for a different node (or switching lock<->unlock) remounts fresh instead of needing an
 *  effect to reset state (same pattern as MarkdownPreview's key={fileId}). */
function LockUnlockForm({
  targetId,
  mode,
  node,
  onDone,
}: {
  targetId: string;
  mode: "lock" | "unlock";
  node: WorkspaceNode;
  onDone: () => void;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLock = mode === "lock";
  const isFolder = node.type === "folder";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      setError(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`);
      return;
    }
    if (isLock && passphrase !== confirmPassphrase) {
      setError("Passphrases don't match.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const ok = isLock ? await lockNode(targetId, passphrase) : await unlockNode(targetId, passphrase);
      if (ok) onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isLock ? <Lock className="size-4" /> : <Unlock className="size-4" />}
          {isLock ? "Lock" : "Unlock"} {isFolder ? "Folder" : "File"}
        </DialogTitle>
        <DialogDescription>
          {isLock ? (
            <>
              Set a passphrase for &ldquo;{node.name}&rdquo;. {isFolder ? "Every file inside it" : "Its content"}{" "}
              will be encrypted immediately and won&rsquo;t be readable again without this passphrase — there is no
              recovery if it&rsquo;s forgotten.
            </>
          ) : (
            <>Enter the passphrase for &ldquo;{node.name}&rdquo; to decrypt it.</>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="lock-passphrase">Passphrase</Label>
          <Input
            id="lock-passphrase"
            type="password"
            autoFocus
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoComplete="off"
          />
        </div>
        {isLock && (
          <div className="space-y-1.5">
            <Label htmlFor="lock-passphrase-confirm">Confirm Passphrase</Label>
            <Input
              id="lock-passphrase-confirm"
              type="password"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {isLock ? <Lock className="size-4" /> : <Unlock className="size-4" />}
          {isLock ? "Lock" : "Unlock"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function LockUnlockDialog() {
  const open = useLockDialogStore((s) => s.open);
  const mode = useLockDialogStore((s) => s.mode);
  const targetId = useLockDialogStore((s) => s.targetId);
  const closeLockDialog = useLockDialogStore((s) => s.closeLockDialog);
  const node = useWorkspaceStore((s) => (targetId ? s.nodes[targetId] : undefined));

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeLockDialog()}>
      <DialogContent className="sm:max-w-sm">
        {targetId && node && (
          <LockUnlockForm key={`${targetId}-${mode}`} targetId={targetId} mode={mode} node={node} onDone={closeLockDialog} />
        )}
      </DialogContent>
    </Dialog>
  );
}
