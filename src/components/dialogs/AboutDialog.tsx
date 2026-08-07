"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUIStore } from "@/store/uiStore";

export function AboutDialog() {
  const open = useUIStore((s) => s.aboutDialogOpen);
  const setOpen = useUIStore((s) => s.setAboutDialogOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={48} height={48} className="rounded-lg" />
          <DialogTitle>NextNotePad.com</DialogTitle>
          <DialogDescription>Phase 1 — Guest Mode</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            NextNotePad.com is a browser-based text editor inspired by Notepad++, built with Next.js,
            React, TypeScript, Monaco Editor and Zustand.
          </p>
          <p>
            Everything in Guest Mode is stored locally in this browser (LocalStorage + IndexedDB) —
            nothing is sent to a server.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
