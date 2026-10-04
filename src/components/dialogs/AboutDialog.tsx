"use client";

import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDialogStore } from "@/store/dialogStore";
import { AppLogo } from "@/components/ui/AppLogo";
import { APP_BRAND } from "@/lib/constants/branding";
import { APP_VERSION } from "@/lib/constants/version";

export function AboutDialog() {
  const open = useDialogStore((s) => s.open.about);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);

  return (
    <Dialog open={open} onOpenChange={(v) => setDialogOpen("about", v)}>
      <DialogContent className="sm:max-w-sm overflow-hidden p-0 gap-0">
        <div className="relative flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#0a0d1a] to-[#111525] px-6 pt-8 pb-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_65%)]" />

          <AppLogo
            size="xl"
            priority
            iconClassName="shadow-[0_8px_32px_rgba(59,130,246,0.3)] ring-0"
          />

          <div className="relative text-center">
            <h2 className="text-[22px] font-bold tracking-tight text-white leading-none">
              {APP_BRAND.name}
              <span className="text-[#F59E0B] ml-0.5 text-base font-semibold align-super leading-none">.com</span>
            </h2>
            <p className="mt-1 text-[12px] text-white/55 font-medium">{APP_BRAND.tagline}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10.5px] font-mono font-medium text-white/80">
              v{APP_VERSION.version}
            </span>
            <span className="rounded-full bg-amber-500/15 border border-amber-400/20 px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-300 uppercase tracking-wide">
              {APP_BRAND.badge}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-[12.5px] text-muted-foreground leading-relaxed">
            A fast, modern browser text editor with offline-first storage, multi-tabs, syntax highlighting
            for 50+ languages, Google Drive sync, diff checker, and developer tools.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11.5px]">
            <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border/60">
              <div className="text-muted-foreground/60 text-[10px] uppercase tracking-wide font-semibold">Stack</div>
              <div className="text-foreground font-medium mt-0.5">Next.js · Monaco · Zustand</div>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border/60">
              <div className="text-muted-foreground/60 text-[10px] uppercase tracking-wide font-semibold">Storage</div>
              <div className="text-foreground font-medium mt-0.5">IndexedDB · Google Drive</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3 text-[10.5px] text-muted-foreground/60 font-mono bg-muted/20">
          <span>Build #{APP_VERSION.buildNumber}{APP_VERSION.commitSha ? ` · ${APP_VERSION.commitSha}` : ""}</span>
          <a
            href="https://nextnotepad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary/70 hover:text-primary transition-colors"
          >
            {APP_BRAND.domain}
            <ExternalLink className="size-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
