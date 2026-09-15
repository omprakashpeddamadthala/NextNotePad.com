"use client";

import { HardDriveDownload } from "lucide-react";
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

import { useDialogStore } from "@/store/dialogStore";

export function MenuBar() {
  const authStatus = useAuthStore((s) => s.status);
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <nav
      role="menubar"
      aria-label="Application menu"
      className="flex h-9 shrink-0 items-center gap-0 border-b bg-[var(--np-toolbar-bg)]/95 px-2 select-none backdrop-blur-xs transition-colors"
      style={{ borderBottomColor: "var(--np-tab-border)" }}
    >
      {/* Brand logo & workspace selector */}
      <button
        type="button"
        onClick={() => openDialog("about")}
        title="About NextNotePad.com"
        aria-label="About NextNotePad"
        className="focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring rounded-md cursor-pointer mr-1.5"
      >
        <AppLogo size="sm" className="hover:scale-105 transition-transform" />
      </button>
      <WorkspaceDropdown />
      <Separator orientation="vertical" className="mx-1.5 h-3.5 opacity-40" />

      {/* Application menus */}
      <div className="np-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overflow-y-hidden text-[12px]">
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
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        <InstallAppButton />
        {authStatus === "guest" && (
          <span className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <HardDriveDownload className="size-3 opacity-80" />
            Guest
          </span>
        )}
        <SyncStatusBadge />
        <AccountMenu />
      </div>
    </nav>
  );
}
