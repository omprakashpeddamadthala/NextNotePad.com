"use client";

import { CloudUpload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMigrationPromptStore } from "@/store/migrationPromptStore";

/** Shown once, right after a first-ever sign-in with existing guest/offline files — asks before pushing them to Drive. */
export function SyncOfflineFilesDialog() {
  const open = useMigrationPromptStore((s) => s.open);
  const fileCount = useMigrationPromptStore((s) => s.fileCount);
  const respond = useMigrationPromptStore((s) => s.respond);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && respond(false)}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudUpload className="size-4" />
            Sync offline files to Drive?
          </DialogTitle>
          <DialogDescription>
            You have {fileCount} offline file{fileCount === 1 ? "" : "s"} saved in this browser from before you
            signed in. Do you want to sync {fileCount === 1 ? "it" : "them"} to your cloud workspace and Google
            Drive?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => respond(false)}>
            No, keep them offline only
          </Button>
          <Button onClick={() => respond(true)}>Yes, sync to Drive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
