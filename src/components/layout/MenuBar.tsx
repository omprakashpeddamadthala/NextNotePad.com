"use client";

import { HardDriveDownload, Settings2 } from "lucide-react";
import { FileMenu } from "@/components/menu/FileMenu";
import { EditMenu } from "@/components/menu/EditMenu";
import { SearchMenu } from "@/components/menu/SearchMenu";
import { ViewMenu } from "@/components/menu/ViewMenu";
import { EncodingMenu } from "@/components/menu/EncodingMenu";
import { LanguageMenu } from "@/components/menu/LanguageMenu";
import { ToolsMenu } from "@/components/menu/ToolsMenu";
import { SettingsMenu } from "@/components/menu/SettingsMenu";
import { WindowMenu } from "@/components/menu/WindowMenu";
import { HelpMenu } from "@/components/menu/HelpMenu";
import { useAuthStore } from "@/store/authStore";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SyncStatusBadge } from "@/components/auth/SyncStatusBadge";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { WorkspaceDropdown } from "@/components/workspace/WorkspaceDropdown";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/ui/AppLogo";
import { ToolbarButton } from "./ToolbarButton";
import { useDialogStore } from "@/store/dialogStore";

export function MenuBar() {
  const authStatus = useAuthStore((s) => s.status);
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <nav
      role="menubar"
      aria-label="Application menu"
      className="np-topbar glass-surface relative z-20 flex h-11 shrink-0 items-center gap-0 border-b px-2.5 transition-colors select-none"
      style={{ borderBottomColor: "var(--np-tab-border)" }}
    >
      {/* Brand logo & workspace selector */}
      <AppLogo
        size="md"
        showText
        className="mr-2 [&>span]:hidden xl:[&>span]:flex"
      />
      <WorkspaceDropdown />
      <Separator orientation="vertical" className="mx-2 h-5 opacity-60" />

      {/* Application menus */}
      <div className="np-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overflow-y-hidden">
        <FileMenu />
        <EditMenu />
        <SearchMenu />
        <ViewMenu />
        <EncodingMenu />
        <LanguageMenu />
        <ToolsMenu />
        <SettingsMenu />
        <WindowMenu />
        <HelpMenu />
      </div>

      {/* Right side: status indicators and account */}
      <div className="border-border/70 ml-auto flex shrink-0 items-center gap-1.5 border-l pl-2.5">
        <ToolbarButton
          icon={Settings2}
          label="Open Settings"
          onClick={() => openDialog("settings")}
        />
        <InstallAppButton />
        {authStatus === "guest" && (
          <span
            className="border-border/70 bg-background/70 text-muted-foreground flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium shadow-xs"
            title="Guest mode — files are stored in this browser"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
            <HardDriveDownload className="size-3 opacity-80" />
            <span className="hidden xl:inline">Guest mode</span>
          </span>
        )}
        <SyncStatusBadge />
        <AccountMenu />
      </div>
    </nav>
  );
}
