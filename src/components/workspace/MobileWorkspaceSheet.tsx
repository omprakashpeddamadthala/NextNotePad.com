"use client";

import { useEffect } from "react";
import { Check, Layers, Loader2, LogIn, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { switchToWorkspace } from "@/services/workspaceSwitch";
import { cn } from "@/lib/utils";

export function MobileWorkspaceSheet() {
  const open = useUIStore((s) => s.mobileWorkspaceSheetOpen);
  const setOpen = useUIStore((s) => s.setMobileWorkspaceSheetOpen);
  const status = useAuthStore((s) => s.status);
  const workspaces = useMultiWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useMultiWorkspaceStore((s) => s.activeWorkspaceId);
  const loadingWorkspaces = useMultiWorkspaceStore((s) => s.loadingWorkspaces);
  const switchingWorkspace = useMultiWorkspaceStore((s) => s.switchingWorkspace);
  const loadError = useMultiWorkspaceStore((s) => s.loadError);
  const loadWorkspaces = useMultiWorkspaceStore((s) => s.loadWorkspaces);
  const setCreateModalOpen = useMultiWorkspaceStore((s) => s.setCreateModalOpen);

  useEffect(() => {
    if (
      open &&
      status === "authenticated" &&
      workspaces.length === 0 &&
      !loadingWorkspaces &&
      !loadError
    ) {
      void loadWorkspaces();
    }
  }, [open, status, workspaces.length, loadingWorkspaces, loadError, loadWorkspaces]);

  function handleSwitch(id: string) {
    setOpen(false);
    void switchToWorkspace(id);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="bg-popover max-h-[80dvh] gap-0 rounded-t-3xl p-0"
      >
        <div className="bg-muted-foreground/25 mx-auto mt-2.5 h-1 w-10 rounded-full" />
        <SheetHeader className="px-5 pt-3 pb-3">
          <SheetTitle className="text-base">Workspaces</SheetTitle>
          <p className="text-muted-foreground text-xs">
            {status === "guest"
              ? "Sign in to keep separate workspaces in your Google Drive."
              : "Each workspace is its own folder in your Google Drive."}
          </p>
        </SheetHeader>

        <div className="np-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {status === "guest" ? (
            <>
              <div className="bg-accent/60 flex items-center gap-3 rounded-2xl px-4 py-3.5">
                <Layers className="text-primary size-5 shrink-0" />
                <span className="flex-1 text-sm font-medium">Guest workspace</span>
                <Check className="text-primary size-4" />
              </div>
              <button
                type="button"
                onClick={() => {
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.assign("/api/auth/google");
                }}
                className="bg-primary text-primary-foreground mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-transform duration-150 active:scale-[0.98]"
              >
                <LogIn className="size-4" />
                Sign in with Google
              </button>
            </>
          ) : loadingWorkspaces ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading workspaces…
            </div>
          ) : (
            <>
              {loadError && workspaces.length === 0 && (
                <div className="text-muted-foreground px-2 py-4 text-sm">
                  Couldn&apos;t load your workspaces.{" "}
                  <button
                    type="button"
                    className="text-primary font-medium underline-offset-2 hover:underline"
                    onClick={() => void loadWorkspaces()}
                  >
                    Try again
                  </button>
                </div>
              )}
              <ul className="space-y-1">
                {workspaces.map((w) => {
                  const active = w.id === activeWorkspaceId;
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => handleSwitch(w.id)}
                        disabled={switchingWorkspace}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors duration-150 disabled:opacity-60",
                          active ? "bg-accent/70" : "active:bg-accent/50",
                        )}
                      >
                        <Layers
                          className={cn(
                            "size-5 shrink-0",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {w.name}
                          </span>
                          {w.description && (
                            <span className="text-muted-foreground block truncate text-xs">
                              {w.description}
                            </span>
                          )}
                        </span>
                        {active &&
                          (switchingWorkspace ? (
                            <Loader2 className="text-muted-foreground size-4 animate-spin" />
                          ) : (
                            <Check className="text-primary size-4" />
                          ))}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCreateModalOpen(true);
                }}
                className="border-border text-foreground active:bg-accent/50 mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed text-sm font-medium transition-colors duration-150"
              >
                <Plus className="size-4" />
                New workspace
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
