"use client";

import { useApiActivityStore } from "@/store/apiActivityStore";

/**
 * CenterApiLoader
 *
 * Replaced the intrusive centered modal popup with a subtle, non-blocking loading icon.
 * Only appears if a network operation takes more than 2 seconds.
 * Never blocks the viewport, never shows modal dialogs, and allows uninterrupted editing.
 */
export function CenterApiLoader() {
  const isSlowLoading = useApiActivityStore((s) => s.isSlowLoading);

  if (!isSlowLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Syncing with cloud"
      className="fixed bottom-4 right-4 z-[9999] pointer-events-none flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
    >
      <div
        className="size-3.5 shrink-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
        aria-hidden="true"
      />
      <span className="text-[11px] font-medium text-muted-foreground">
        Syncing…
      </span>
    </div>
  );
}
