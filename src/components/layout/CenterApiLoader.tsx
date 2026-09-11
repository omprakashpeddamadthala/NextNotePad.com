"use client";

import { useApiActivityStore } from "@/store/apiActivityStore";

/**
 * CenterApiLoader
 *
 * Appears cleanly at the center of the viewport whenever a backend API request
 * takes more time (> 500ms). Simple, lightweight, and matching the website's
 * primary theme color and minimalist aesthetic.
 */
export function CenterApiLoader() {
  const isSlowLoading = useApiActivityStore((s) => s.isSlowLoading);
  const currentAction = useApiActivityStore((s) => s.currentAction);

  if (!isSlowLoading) return null;

  const displayAction = currentAction ? currentAction : "Processing request";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading in progress"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/40 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-card/95 px-5 py-3.5 shadow-xl backdrop-blur-md animate-in zoom-in-95 duration-150">
        {/* Simple theme-matching circular spinner */}
        <div
          className="size-5 shrink-0 rounded-full border-2 border-primary/25 border-t-primary animate-spin"
          aria-hidden="true"
        />

        {/* Action description & status */}
        <div className="flex flex-col pr-1 text-left">
          <span className="text-xs font-medium tracking-tight text-foreground">
            {displayAction}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Please wait a moment...
          </span>
        </div>
      </div>
    </div>
  );
}
