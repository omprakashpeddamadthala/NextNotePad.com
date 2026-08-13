"use client";

import { Menu, PanelLeft, Search, Command as CommandIcon } from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import { useUIStore } from "@/store/uiStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { runAction } from "@/services/shortcuts/actionRegistry";

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
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const { file } = useActiveFile();

  return (
    <div
      role="toolbar"
      aria-label="Mobile toolbar"
      className="flex h-11 shrink-0 items-center gap-0.5 border-b bg-[var(--np-toolbar-bg)] px-1"
    >
      <ToolbarButton
        icon={PanelLeft}
        label="Toggle File Explorer"
        active={mobileSidebarOpen}
        onClick={() => toggleMobileSidebar()}
      />
      <ToolbarButton icon={Menu} label="Menu" onClick={() => setMobileMenuSheetOpen(true)} />
      <span className="min-w-0 flex-1 truncate px-1 text-center text-sm font-medium">
        {file ? file.name : "NextNotePad.com"}
      </span>
      <ToolbarButton icon={Search} label="Find (Ctrl+F)" onClick={() => runAction("search.find")} />
      <ToolbarButton
        icon={CommandIcon}
        label="Command Palette"
        onClick={() => setCommandPaletteOpen(true)}
      />
    </div>
  );
}
