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
    <div className="flex h-full flex-col border-t bg-background">
      <div className="flex h-7 shrink-0 items-center border-b">
        <button
          type="button"
          onClick={() => setActiveBottomTab("search")}
          className={cn(
            "flex h-full items-center gap-1.5 border-r px-3 text-xs",
            activeBottomTab === "search" ? "bg-background font-medium" : "bg-[var(--np-tab-inactive-bg)] text-muted-foreground",
          )}
        >
          <Search className="size-3.5" /> Search Results
        </button>
        <button
          type="button"
          onClick={() => setActiveBottomTab("console")}
          className={cn(
            "flex h-full items-center gap-1.5 border-r px-3 text-xs",
            activeBottomTab === "console" ? "bg-background font-medium" : "bg-[var(--np-tab-inactive-bg)] text-muted-foreground",
          )}
        >
          <Terminal className="size-3.5" /> Console
        </button>
        <button
          type="button"
          aria-label="Close panel"
          onClick={() => setBottomPanelVisible(false)}
          className="ml-auto flex h-full items-center px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {activeBottomTab === "search" ? (
          <SearchResultsPanel />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No console output. (Guest Mode runs entirely in the browser — there&apos;s no build/run step to
            show here.)
          </div>
        )}
      </div>
    </div>
  );
}
