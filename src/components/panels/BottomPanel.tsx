"use client";

import { Search, Terminal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { SearchResultsPanel } from "./SearchResultsPanel";

export function BottomPanel() {
  const activeBottomTab = useUIStore((s) => s.activeBottomTab);
  const setActiveBottomTab = useUIStore((s) => s.setActiveBottomTab);
  const setBottomPanelVisible = useUIStore((s) => s.setBottomPanelVisible);

  return (
    <div className="bg-background flex h-full flex-col">
      <div
        className="flex h-8 shrink-0 items-center border-b"
        style={{ borderBottomColor: "var(--np-tab-border)" }}
      >
        <button
          type="button"
          onClick={() => setActiveBottomTab("search")}
          className={cn(
            "focus-visible:ring-ring flex h-full items-center gap-1.5 border-r px-3 text-[11px] transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset",
            activeBottomTab === "search"
              ? "bg-background font-medium text-foreground"
              : "text-muted-foreground bg-[var(--np-tab-inactive-bg)] hover:bg-[var(--np-menu-hover)]",
          )}
        >
          <Search className="size-3.5" /> Search Results
        </button>
        <button
          type="button"
          onClick={() => setActiveBottomTab("console")}
          className={cn(
            "focus-visible:ring-ring flex h-full items-center gap-1.5 border-r px-3 text-[11px] transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset",
            activeBottomTab === "console"
              ? "bg-background font-medium text-foreground"
              : "text-muted-foreground bg-[var(--np-tab-inactive-bg)] hover:bg-[var(--np-menu-hover)]",
          )}
        >
          <Terminal className="size-3.5" /> Console
        </button>
        <button
          type="button"
          aria-label="Close panel"
          onClick={() => setBottomPanelVisible(false)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-ring ml-auto flex h-full items-center px-2.5 focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset rounded-none"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {activeBottomTab === "search" ? (
          <SearchResultsPanel />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            No console output. (Guest Mode runs entirely in the browser —
            there&apos;s no build/run step to show here.)
          </div>
        )}
      </div>
    </div>
  );
}
