"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDialogStore } from "@/store/dialogStore";

export function AboutDialog() {
  const open = useDialogStore((s) => s.open.about);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);

  return (
    <Dialog open={open} onOpenChange={(v) => setDialogOpen("about", v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={48} height={48} className="rounded-lg" />
          <DialogTitle>NextNotePad.com</DialogTitle>
          <DialogDescription>A Notepad++-style editor for the browser</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Built with Next.js, React, TypeScript, Monaco Editor and Zustand — a full tabbed editor,
            file explorer, find/replace, diff checker, and a growing set of developer text tools,
            all running in your browser.
          </p>
          <p>
            Use it in Guest Mode with everything stored locally (LocalStorage + IndexedDB, nothing
            sent to a server), or sign in with Google to sync your workspace to Drive.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
