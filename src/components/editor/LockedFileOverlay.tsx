"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { unlockSingleFile } from "@/services/fileLock";

/** Covers the editor area for a locked file — nothing is decrypted or readable until the correct
 *  passphrase is entered. Keyed by fileId in the parent so switching between locked tabs never
 *  carries over a stale passphrase/error from a different file. */
export function LockedFileOverlay({ fileId }: { fileId: string }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await unlockSingleFile(fileId, passphrase);
      if (result.status === "wrong-passphrase") setError("Incorrect passphrase.");
      // On success, the workspace node's `locked` flips to false, which the parent reacts to.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-background absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Lock className="text-muted-foreground size-8" />
      <p className="text-sm font-medium">This file is locked</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex w-full max-w-xs flex-col gap-2">
        <Input
          type="password"
          autoFocus
          placeholder="Passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          autoComplete="off"
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
        <Button type="submit" size="sm" disabled={busy}>
          <Unlock className="size-4" /> Unlock
        </Button>
      </form>
    </div>
  );
}
