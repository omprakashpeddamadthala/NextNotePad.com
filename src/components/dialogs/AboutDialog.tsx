"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDialogStore } from "@/store/dialogStore";
import { AppLogo } from "@/components/ui/AppLogo";
import { APP_BRAND } from "@/lib/constants/branding";
import { APP_VERSION } from "@/lib/constants/version";

export function AboutDialog() {
  const open = useDialogStore((s) => s.open.about);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);

  return (
    <Dialog open={open} onOpenChange={(v) => setDialogOpen("about", v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center text-center pb-2">
          <AppLogo size="xl" className="mb-2 shadow-lg ring-1 ring-white/20" />
          <DialogTitle className="flex items-center gap-1.5 text-lg">
            <span>{APP_BRAND.name}</span>
            <span className="text-primary text-xs font-semibold">.com</span>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary uppercase tracking-wide ml-1">
              {APP_BRAND.badge}
            </span>
          </DialogTitle>

          <div className="flex items-center gap-2 mt-1">
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-medium text-foreground/90 border border-border/60">
              v{APP_VERSION.version}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Released {APP_VERSION.releaseDate}
            </span>
          </div>

          <DialogDescription className="text-xs font-medium text-foreground/85 mt-2">
            {APP_BRAND.tagline}
          </DialogDescription>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            {APP_BRAND.subTagline}
          </p>
        </DialogHeader>
        <div className="space-y-2.5 text-xs text-muted-foreground pt-1 border-t">
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

        <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 pt-2 border-t font-mono">
          <span>Build #{APP_VERSION.buildNumber}{APP_VERSION.commitSha ? ` (${APP_VERSION.commitSha})` : ""}</span>
          <span>Last deployed: {APP_VERSION.shortDate}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
