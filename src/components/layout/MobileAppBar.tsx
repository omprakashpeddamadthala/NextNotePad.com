"use client";

import { Menu, PanelLeft, Settings2 } from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import { AppLogo } from "@/components/ui/AppLogo";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { useUIStore } from "@/store/uiStore";
import { useDialogStore } from "@/store/dialogStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { APP_BRAND } from "@/lib/constants/branding";

/**
 * Mobile's stand-in for the desktop MenuBar + Toolbar: one compact row instead of two dense,
 * horizontally-scrolling desktop bars that (per the desktop-tuned layout) left most buttons
 * reachable only by scrolling sideways — poor discoverability and a bad look on a phone.
 * The sidebar toggle stays directly on the bar (frequent, one-tap); everything else — every
 * menu and every toolbar action, none removed — lives in `MobileMenuSheet` behind the hamburger.
 */
export function MobileAppBar() {
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
  const setMobileMenuSheetOpen = useUIStore((s) => s.setMobileMenuSheetOpen);
  const openDialog = useDialogStore((s) => s.openDialog);
  const { file } = useActiveFile();

  return (
    <div
      role="toolbar"
      aria-label="Mobile toolbar"
      className="np-topbar glass-surface relative z-20 flex h-14 shrink-0 items-center gap-0.5 border-b px-1.5 pt-[env(safe-area-inset-top)]"
    >
      <ToolbarButton
        icon={PanelLeft}
        label="Toggle File Explorer"
        active={mobileSidebarOpen}
        onClick={() => toggleMobileSidebar()}
        size="touch"
      />
      <ToolbarButton
        icon={Menu}
        label="Menu"
        onClick={() => setMobileMenuSheetOpen(true)}
        size="touch"
      />
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-1">
        <AppLogo size="xs" className="shrink-0" />
        <div className="min-w-0 text-center leading-tight">
          <span className="text-foreground block truncate text-[13px] font-semibold">
            {file ? file.name : APP_BRAND.name}
          </span>
          <span className="text-muted-foreground block truncate text-[10px]">
            {file ? "Editing locally" : "Ready to write"}
          </span>
        </div>
      </div>
      <InstallAppButton iconOnly />
      <ToolbarButton
        icon={Settings2}
        label="Open Settings"
        onClick={() => openDialog("settings")}
        size="touch"
      />
    </div>
  );
}
