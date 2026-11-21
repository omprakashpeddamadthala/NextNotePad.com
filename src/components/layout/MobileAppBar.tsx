"use client";

import { BookOpen, ChevronDown, Ellipsis, PanelLeft, PenLine } from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import { AppLogo } from "@/components/ui/AppLogo";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { useMobileReadMode } from "@/hooks/useMobileReadMode";
import { APP_BRAND } from "@/lib/constants/branding";

export function MobileAppBar() {
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
  const setMobileMenuSheetOpen = useUIStore((s) => s.setMobileMenuSheetOpen);
  const setMobileWorkspaceSheetOpen = useUIStore(
    (s) => s.setMobileWorkspaceSheetOpen,
  );
  const authStatus = useAuthStore((s) => s.status);
  const workspaceName = useMultiWorkspaceStore(
    (s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId)?.name,
  );
  const { file } = useActiveFile();
  const { canToggle, reading, toggle } = useMobileReadMode();

  const subtitle =
    authStatus === "guest"
      ? "Guest workspace"
      : (workspaceName ?? "My Workspace");

  return (
    <div
      role="toolbar"
      aria-label="Mobile toolbar"
      className="np-topbar glass-surface relative z-20 flex shrink-0 items-center gap-1 border-b px-1.5 pt-[env(safe-area-inset-top)]"
    >
      <div className="flex h-14 w-full items-center gap-1">
        <ToolbarButton
          icon={PanelLeft}
          label="Files"
          active={mobileSidebarOpen}
          onClick={() => toggleMobileSidebar()}
          size="touch"
        />

        <button
          type="button"
          onClick={() => setMobileWorkspaceSheetOpen(true)}
          aria-label={`Switch workspace (current: ${subtitle})`}
          className="active:bg-accent/70 flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors duration-150"
        >
          <AppLogo size="sm" className="shrink-0" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="text-foreground block truncate text-[14px] font-semibold tracking-tight">
              {file ? file.name : APP_BRAND.name}
            </span>
            <span className="text-muted-foreground flex items-center gap-0.5 text-[11px]">
              <span className="truncate">{subtitle}</span>
              <ChevronDown className="size-3 shrink-0 opacity-70" />
            </span>
          </span>
        </button>

        {canToggle && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={reading}
            aria-label={reading ? "Switch to edit mode" : "Switch to read mode"}
            className="border-border/70 bg-background/70 text-foreground active:bg-accent relative flex h-9 shrink-0 after:absolute after:-inset-1 after:content-[''] items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium shadow-xs transition-[background-color,transform] duration-150 active:scale-[0.97]"
          >
            {reading ? (
              <PenLine className="size-3.5" />
            ) : (
              <BookOpen className="size-3.5" />
            )}
            {reading ? "Edit" : "Read"}
          </button>
        )}

        <ToolbarButton
          icon={Ellipsis}
          label="More options"
          onClick={() => setMobileMenuSheetOpen(true)}
          size="touch"
        />
      </div>
    </div>
  );
}
